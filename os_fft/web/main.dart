import 'dart:html';
import 'dart:math';
import 'dart:typed_data';

import 'package:fftea/fftea.dart';
import 'package:wav/wav.dart';

import 'itr_util.dart';
import 'note_type.pbenum.dart' as pbnt;
import 'sequence.pb.dart' as pb;

final domBody = querySelector('body')!;
final domInput = querySelector('input')! as InputElement;
final domError = querySelector('#error')!;
final domSelectedFile = querySelector('#selected_file')!;
final domSelectedDuration = querySelector('#selected_duration')!;
final domGoRow = querySelector('#go_row')!;
final domGoButton = querySelector('#go_btn')!;
final domStatus = querySelector('#status')!;
final domModeSelect = querySelector('#mode')! as SelectElement;
final domBpm = querySelector('#bpm')!;
final domAdvOptButton = querySelector('#adv_opt_btn')!;
final domAdvOpt = querySelector('#adv_opt')!;
final domAdvOptLeft = querySelector('#adv_opt_left')!;
final domAdvOptRight = querySelector('#adv_opt_right')!;
final domOutputRow = querySelector('#output_row')!;
final domCopyButton = querySelector('#copy_btn')!;
final domDownloadButton = querySelector('#download_btn')!;

void hide(Element e) => e.classes.add('hidden');
void show(Element e) => e.classes.remove('hidden');
void setShown(Element e, bool shown) => shown ? show(e) : hide(e);
bool isHidden(Element e) => e.classes.contains('hidden');

const kTimeStepsPerBeat = 4;
const kNotesPerOctave = 12;
const kC0Freq = 16.351597831287414;
const kMinPitch = 2 * kNotesPerOctave;
const kMaxPitch = 8 * kNotesPerOctave - 1;
const kInstSin = 13;
const kCloneOffset = 10000;
const kMainVolume = 3;
const kPitchNames = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B'
];
const kMagicString = 'Online Sequencer';
final kWindowFns = <String, Float64List Function(int)?>{
  'None': null,
  'Hann': Window.hanning,
  'Hamming': Window.hamming,
  'Bartlett': Window.bartlett,
  'Blackman': Window.blackman,
};

extension RandUtil on Random {
  double randf(double min, double max) => (nextDouble() * (max - min)) + min;
}

class WavFile {
  final String name;
  final Wav wav;
  WavFile(this.name, this.wav);
}

abstract class ConfigValue<T> {
  set value(T val);
  T get value;
}

abstract class ActiveConfigValue<T> extends ConfigValue<T> {
  Element get element;
}

T clamp<T extends num>(T x, T? min, T? max) {
  if (min != null && x <= min) return min;
  if (max != null && x >= max) return max;
  return x;
}

class FloatConfigValue implements ActiveConfigValue<double> {
  double _val;
  final double? min;
  final double? max;
  final InputElement _element;

  FloatConfigValue({this.min, this.max})
      : _val = min ?? max ?? 0,
        _element = InputElement(type: 'number') {
    _element.valueAsNumber = _val;
    _element.onChange
        .listen((_) => value = ((_element.valueAsNumber as double?) ?? _val));
  }

  @override
  set value(double val) => _element.valueAsNumber = _val = clamp(val, min, max);

  @override
  double get value => _val;

  @override
  Element get element => _element;
}

class IntConfigValue implements ActiveConfigValue<int> {
  int _val;
  final int? min;
  final int? max;
  final InputElement _element;

  IntConfigValue({this.min, this.max})
      : _val = min ?? max ?? 0,
        _element = InputElement(type: 'number') {
    _element.valueAsNumber = _val;
    _element.onChange
        .listen((_) => value = (_element.valueAsNumber?.round() ?? _val));
  }

  @override
  set value(int val) => _element.valueAsNumber = _val = clamp(val, min, max);

  @override
  int get value => _val;

  @override
  Element get element => _element;
}

class SelectConfigValue implements ActiveConfigValue<String> {
  String _val;
  final SelectElement _element;

  SelectConfigValue(List<String> options)
      : _val = options[0],
        _element = SelectElement() {
    for (int i = 0; i < options.length; ++i) {
      final opt = OptionElement(value: options[i])..innerText = options[i];
      _element.children.add(opt);
    }
    _element.onChange.listen((_) => value = (_element.value ?? _val));
    window.animationFrame.then((_) => _element.value = options[0]);
  }

  @override
  set value(String val) => _element.value = _val = val;

  @override
  String get value => _val;

  @override
  Element get element => _element;
}

class BoolConfigValue implements ActiveConfigValue<bool> {
  final CheckboxInputElement _element;

  BoolConfigValue() : _element = CheckboxInputElement();

  @override
  set value(bool val) => _element.checked = val;

  @override
  bool get value => _element.checked ?? false;

  @override
  Element get element => _element;
}

class ConfigField<T> {
  final Element _element;
  final ActiveConfigValue<T> activeValue;
  final String name;
  final T defaultValue;
  ConfigField({
    required Element parent,
    required this.name,
    required this.defaultValue,
    required this.activeValue,
    required String desc,
    String? tooltip,
  }) : _element = SpanElement() {
    _element.classes.add('config_input');
    _element.children.add(SpanElement()..innerText = '$desc:');
    _element.children.add(activeValue.element);
    if (tooltip != null) {
      _element.onMouseEnter.listen((_) => setTooltip(tooltip));
    }
    parent.children.add(_element);
  }
  ConfigValue<T> getDefault(bool isActive) =>
      isActive ? activeValue : MemoryConfigValue<T>(defaultValue);
}

class MemoryConfigValue<T> implements ConfigValue<T> {
  T _val;
  MemoryConfigValue(this._val);
  set value(T val) => _val = val;
  T get value => _val;
}

const kTooltipChunkFreq = '''
The FFT is run in chunks (aka STFT). The minimum and maximum chunk
frequency control how many chunks occur per second. If they differ, a
random frequency between them will be chosen, for each chunk. These
are the most important settings. There's a trade off between time and
frequency accuracy: larger chunks give you more frequency accuracy but
less time accuracy.
<br/><br/>
Higher chunk frequencies will also become an
audible tone in the output. Randomizing the chunk frequency helps
mitigate this effect by turning that tone into white noise. However,
the robot preset uses this audible chunk frequency effect to its
advantage, effectively auto-tuning the
input voice to one specific frequency.
You can also use detune markers in OS
to <a href="https://onlinesequencer.net/playlist/870/2053924">make the
robot sing</a>).
''';

const kTooltipChunkSizeRatio = '''
The chunk size ratio controls how the chunks overlap.
Overlapping the chunks can give you more frequency accuracy, but use it
with caution as it can muddy the output if you make it too big.
''';

const kTooltipWindowFunc = '''
Windowing can help mitigate the audible chunk frequency problem, but
can also have strange effects on the output. There are several different
window functions to choose from. There's really no way of knowing which
will work best, other than to try it out.
''';

const kTooltipDetune = '''
The detune parameter sets the detune of the sine instrument. This allows
the FFT to reproduce frequencies outside the normal bounds of the
instrument. Note that this doesn't make the output sound higher or lower
in pitch, just shifts the range of frequencies that can be reproduced.
Detuning up usually makes things sound clearer (especially voices) but
means the lower frequencies fall off the bottom of the piano and are
lost.
''';

const kTooltipNumFreq = '''
To restrict the result to the loudest N frequencies, set the number of
frequencies parameter. Leave it at 0 to output all the frequencies.
Restricting the number of frequencies is mainly useful if you want to
extract the melody from the input. It can also be useful if you need to
reduce the number of notes in the output.
''';

const kTooltipMinNoteVolume = '''
Any notes quieter than the minimum note volume will be deleted from the
output. Choosing a good minimum will reduce the total number of notes in
the output, without affecting the clarity.
''';

const kTooltipOutVolume = '''
The overall output volume sets the volume that the result should be
normalized to. Use this if the output is too loud or too quiet, or just
change the sine instrument volume in OS.
''';

const kTooltipMicrotones = '''
One of the biggest limitations of using FFT on OS is that the only frequencies
that can be reproduced are the piano notes. So all the frequencies that the FFT
creates have to be snapped to the piano frequencies. We can work around this by
making clones of the sine instrument, detuned by microtones. This improves the
result of any FFT, but is especially useful for reproducing music or singing.
<br/><br/>
Be careful though, because having lots of cloned sine instruments is very CPU
intensive, and there's diminishing returns in terms of the audio quality. Try
to use as few as necessary to get the level of quality you want. Any more than
10 is probably a bad idea.
''';

const kTooltipStereo = '''
If the stereo option is enabled, and your input audio has 2 channels,
the left and right channels will be FFT'd
separately using instrument clones. Otherwise, they'll be combined into mono
audio. This doubles the number of sine instruments, which significantly
increases the CPU cost of the sequence. Only use this if you need it, and be
careful when combining it with microtones.
''';

final kConfigSchema = <ConfigField>[
  ConfigField<int>(
    parent: domBpm,
    name: 'bpm',
    defaultValue: 110,
    activeValue: IntConfigValue(min: 10, max: 999),
    desc: 'BPM',
  ),
  ConfigField<double>(
    parent: domAdvOptLeft,
    name: 'minChunksPerSec',
    defaultValue: 55,
    activeValue: FloatConfigValue(min: 0.01),
    desc: 'Minimum chunks frequency (Hz)',
    tooltip: kTooltipChunkFreq,
  ),
  ConfigField<double>(
    parent: domAdvOptLeft,
    name: 'maxChunksPerSec',
    defaultValue: 55,
    activeValue: FloatConfigValue(min: 0.01),
    desc: 'Maximum chunks frequency (Hz)',
    tooltip: kTooltipChunkFreq,
  ),
  ConfigField<double>(
    parent: domAdvOptLeft,
    name: 'chunkSizeRatio',
    defaultValue: 1,
    activeValue: FloatConfigValue(min: 1),
    desc: 'Chunk size ratio',
    tooltip: kTooltipChunkSizeRatio,
  ),
  ConfigField<String>(
    parent: domAdvOptLeft,
    name: 'window',
    defaultValue: 'None',
    activeValue: SelectConfigValue(kWindowFns.keys.toList()),
    desc: 'Window function',
    tooltip: kTooltipWindowFunc,
  ),
  ConfigField<double>(
    parent: domAdvOptLeft,
    name: 'detune',
    defaultValue: 0,
    activeValue: FloatConfigValue(),
    desc: 'Detune (cents)',
    tooltip: kTooltipDetune,
  ),
  ConfigField<int>(
    parent: domAdvOptLeft,
    name: 'numFreq',
    defaultValue: 0,
    activeValue: IntConfigValue(min: 0),
    desc: 'Number of frequencies',
    tooltip: kTooltipNumFreq,
  ),
  ConfigField<double>(
    parent: domAdvOptLeft,
    name: 'minVolume',
    defaultValue: 0.01,
    activeValue: FloatConfigValue(min: 0),
    desc: 'Minimum note volume',
    tooltip: kTooltipMinNoteVolume,
  ),
  ConfigField<double>(
    parent: domAdvOptLeft,
    name: 'outputVolume',
    defaultValue: 1,
    activeValue: FloatConfigValue(min: 0.01),
    desc: 'Overall output volume',
    tooltip: kTooltipOutVolume,
  ),
  ConfigField<int>(
    parent: domAdvOptLeft,
    name: 'microtones',
    defaultValue: 1,
    activeValue: IntConfigValue(min: 1),
    desc: 'Number of microtones',
    tooltip: kTooltipMicrotones,
  ),
  ConfigField<bool>(
    parent: domAdvOptLeft,
    name: 'stereo',
    defaultValue: false,
    activeValue: BoolConfigValue(),
    desc: 'Stereo',
    tooltip: kTooltipStereo,
  ),
];

int findConfigId(String name) =>
    kConfigSchema.firstIndexWhere((field) => field.name == name);

final kMinChunksPerSecId = findConfigId('minChunksPerSec');
final kMaxChunksPerSecId = findConfigId('maxChunksPerSec');
final kChunkSizeRatioId = findConfigId('chunkSizeRatio');
final kWindowId = findConfigId('window');
final kBpmId = findConfigId('bpm');
final kOutputVolumeId = findConfigId('outputVolume');
final kMinVolumeId = findConfigId('minVolume');
final kDetuneId = findConfigId('detune');
final kNumFreqId = findConfigId('numFreq');
final kMicrotonesId = findConfigId('microtones');
final kStereoId = findConfigId('stereo');

class Config {
  final values = <ConfigValue>[];

  Config({bool isActive = false}) {
    kConfigSchema.forEach((field) => values.add(field.getDefault(isActive)));
  }

  double get minChunksPerSec => values[kMinChunksPerSecId].value as double;
  set minChunksPerSec(double value) => values[kMinChunksPerSecId].value = value;
  double get maxChunksPerSec => values[kMaxChunksPerSecId].value as double;
  set maxChunksPerSec(double value) => values[kMaxChunksPerSecId].value = value;
  double get chunkSizeRatio => values[kChunkSizeRatioId].value as double;
  set chunkSizeRatio(double value) => values[kChunkSizeRatioId].value = value;
  String get window => values[kWindowId].value as String;
  set window(String value) => values[kWindowId].value = value;
  int get bpm => values[kBpmId].value as int;
  set bpm(int value) => values[kBpmId].value = value;
  double get outputVolume => values[kOutputVolumeId].value as double;
  set outputVolume(double value) => values[kOutputVolumeId].value = value;
  double get minVolume => values[kMinVolumeId].value as double;
  set minVolume(double value) => values[kMinVolumeId].value = value;
  double get detune => values[kDetuneId].value as double;
  set detune(double value) => values[kDetuneId].value = value;
  int get numFreq => values[kNumFreqId].value as int;
  set numFreq(int value) => values[kNumFreqId].value = value;
  int get microtones => values[kMicrotonesId].value as int;
  set microtones(int value) => values[kMicrotonesId].value = value;
  bool get stereo => values[kStereoId].value as bool;
  set stereo(bool value) => values[kStereoId].value = value;

  void copyFrom(Config other) {
    for (int i = 0; i < values.length; ++i) {
      values[i].value = other.values[i].value;
    }
  }

  double get detuneNotes => detune / 100;
  double timeToStep(double t) => t * (bpm / 60) * kTimeStepsPerBeat;
  int chunkSize(double samplesPerSecond) =>
      (samplesPerSecond * chunkSizeRatio / maxChunksPerSec).round();
  double generateChunkStride(double samplesPerSecond, Random rand) =>
      samplesPerSecond /
      (minChunksPerSec < maxChunksPerSec
          ? rand.randf(minChunksPerSec, maxChunksPerSec)
          : minChunksPerSec);
  int freqToPitch(double f) =>
      (microtones * (kNotesPerOctave * log2(f / kC0Freq) - detuneNotes))
          .round();
  bool get hasClones => (microtones == 1) && !stereo;
  bool get shouldShowCopyNotes => hasClones;
  @override
  String toString() {
    String str = '';
    for (int i = 0; i < values.length; ++i) {
      values.join('\n');
      str += '${kConfigSchema[i].name}: ${values[i].value}\n';
    }
    return str;
  }
}

final defaultConfigs = <String, Config>{
  'talk': Config()
    ..minChunksPerSec = 100
    ..maxChunksPerSec = 200
    ..detune = 1200,
  // TODO: Use pitch tracking chunks per second, when available.
  'sing': Config()
    ..minChunksPerSec = 25
    ..maxChunksPerSec = 50
    ..detune = 1200,
  'perc': Config()
    ..minChunksPerSec = 50
    ..maxChunksPerSec = 100
    ..chunkSizeRatio = 2
    ..window = 'Blackman'
    ..detune = 600,
  // TODO: Use pitch tracking chunks per second, when available.
  'music': Config()
    ..minChunksPerSec = 25
    ..maxChunksPerSec = 50
    ..chunkSizeRatio = 2
    ..detune = 0,
  // TODO: Use pitch tracking chunks per second, when available.
  'melody': Config()
    ..minChunksPerSec = 25
    ..maxChunksPerSec = 50
    ..chunkSizeRatio = 2
    ..numFreq = 4
    ..detune = 0,
  'robot': Config()
    ..minChunksPerSec = 100
    ..maxChunksPerSec = 100
    ..detune = 1200,
};

final Config activeConfig = Config(isActive: true);
WavFile? activeWav;
FFTJob? activeJob;

double log2(double x) => log(x) / ln2;
String maybeStripSuffix(String text, String suffix) => text.endsWith(suffix)
    ? text.substring(0, text.length - suffix.length)
    : text;

class Sine {
  double f;
  Float64x2 p;
  double get amp => sqrt(p.x * p.x + p.y * p.y);
  double get phase => atan2(p.y, p.x);
  Sine(this.f, this.p);
}

Sine mergeSines(List<Sine> sines) {
  // Average the frequencies and add the phasors.
  // TODO: Take beat frequencies into account: the amplitude of the phasor
  // should be affected by the fact that the frequenices are slightly different.
  final sum = Sine(0, Float64x2(0, 0));
  for (final s in sines) {
    sum.f += s.f;
    sum.p += s.p;
  }
  sum.f /= sines.length;
  return sum;
}

class Note {
  int instrument;
  double time;
  double length;
  int pitch;
  double volume;
  Note({
    this.instrument = kInstSin,
    required this.time,
    required this.length,
    required this.pitch,
    required this.volume,
  });
  double getTimeStep(Config config) => config.timeToStep(time);
  double getLengthStep(Config config) => config.timeToStep(length);
  int get pitchOctave => pitch ~/ 12;
  String get pitchName => '${kPitchNames[pitch % 12]}$pitchOctave';
  pbnt.NoteType get pbType => pbnt.NoteType.values[pitch];
  String toNoteString(Config config) => '${getTimeStep(config)} ${pitchName}'
      ' ${getLengthStep(config)} ${instrument} ${volume}';
}

// Clone of STFT class, with some async functionality, so we can update the UI.
class AsyncSTFT {
  final Float64List Function(int)? _winFn;
  int? _size = null;
  late int _stride;
  late FFT _fft;
  Float64List? _win;
  late Float64x2List _chunk;

  AsyncSTFT([this._winFn]);

  double frequency(int index, double samplesPerSecond) =>
      _fft.frequency(index, samplesPerSecond);

  void setChunkSize(int chunkSize, int chunkStride) {
    if (_size != chunkSize) {
      _size = chunkSize;
      _stride = chunkStride;
      _fft = FFT(chunkSize);
      final wm = _winFn;
      if (wm != null) _win = wm(chunkSize);
      _chunk = Float64x2List(chunkSize);
    }
  }

  Future<void> run(List<double> input,
      Future<bool> Function(int, Float64x2List) reportChunk) async {
    for (int i = 0;; i += _stride) {
      final chunkSize = _fft.size;
      final i2 = i + chunkSize;
      if (i2 > input.length) {
        int j = 0;
        final stop = input.length - i;
        for (; j < stop; ++j) {
          _chunk[j] = Float64x2(input[i + j], 0);
        }
        for (; j < chunkSize; ++j) {
          _chunk[j] = Float64x2.zero();
        }
      } else {
        for (int j = 0; j < chunkSize; ++j) {
          _chunk[j] = Float64x2(input[i + j], 0);
        }
      }
      _win?.inPlaceApplyWindow(_chunk);
      _fft.inPlaceFft(_chunk);
      if (!await reportChunk(i, _chunk)) {
        break;
      }
      if (i2 >= input.length) {
        break;
      }
    }
  }
}

class FFTJob {
  final List<Float64List> channels;
  final double sampleRate;
  final String name;
  final Config config = Config();
  final List<Note> outNotes = <Note>[];
  final rand = Random();
  bool done = false;
  bool stopped = false;

  FFTJob(Wav wav, this.name, Config inputConfig)
      : sampleRate = wav.samplesPerSecond.toDouble(),
        channels = ((wav.channels.length == 2) && inputConfig.stereo)
            ? wav.channels
            : [wav.toMono()] {
    config.copyFrom(inputConfig);
  }
  void stop() => stopped = true;

  int getCloneIndex(int microtoneIndex, int chan) =>
      microtoneIndex + config.microtones * chan;

  Future<void> run(Future<void> Function(double) onProgress) async {
    final chunks = <List<Note>>[];
    for (int chan = 0; chan < channels.length; ++chan) {
      await _runMono(chunks, chan, onProgress);
      if (stopped) return;
    }
    _output(chunks);
  }

  Future<void> _runMono(List<List<Note>> chunks, int chan,
      Future<void> Function(double) onProgress) async {
    final audio = channels[chan];
    final totalSamples = audio.length;
    final stft = AsyncSTFT(kWindowFns[config.window]);

    double getChunkStride() => config.generateChunkStride(sampleRate, rand);
    void updateChunkSize(double s) =>
        stft.setChunkSize((s * config.chunkSizeRatio).round(), s.round());
    updateChunkSize(getChunkStride());

    // Run STFT.
    await stft.run(audio, (int firstSample, Float64x2List freq) async {
      final chunkStart = firstSample / sampleRate;
      final nextChunkStride = getChunkStride();
      final chunkLength = nextChunkStride.round() / sampleRate;
      int? currentPitch;
      List<Sine> sines = <Sine>[];
      final notes = <Note>[];

      // Merge all sines that fall on the same note, and create a note for them.
      void flushSines() {
        if (sines.length == 0) return;
        final s = mergeSines(sines);
        sines = <Sine>[];
        final vol = s.amp;
        final pitch = config.freqToPitch(s.f);
        final pianoIndex = pitch ~/ config.microtones;
        final microtoneIndex = pitch % config.microtones;
        final cloneIndex = getCloneIndex(microtoneIndex, chan);
        if (pianoIndex >= kMinPitch && pianoIndex <= kMaxPitch) {
          notes.add(Note(
            instrument: cloneIndex * kCloneOffset + kInstSin,
            time: chunkStart,
            length: chunkLength,
            pitch: pianoIndex,
            volume: vol,
          ));
        }
      }

      // Convert frequencies to merged sine notes.
      for (int i = 1; i < freq.length; ++i) {
        final p = freq[i];
        final f = stft.frequency(i, sampleRate);
        final pitch = config.freqToPitch(f);
        if (pitch != currentPitch) {
          flushSines();
          currentPitch = pitch;
        }
        sines.add(Sine(f, p));
      }
      flushSines();

      // Filter the notes, if necessary.
      List<Note> filteredNotes = notes;
      if (config.numFreq > 0) {
        filteredNotes = <Note>[];
        notes.sort((Note a, Note b) {
          if (a.volume > b.volume) return -1;
          if (a.volume < b.volume) return 1;
          return 0;
        });
        final n = min(config.numFreq, notes.length);
        for (int i = 0; i < n; ++i) filteredNotes.add(notes[i]);
      }
      chunks.add(filteredNotes);

      updateChunkSize(nextChunkStride);
      await onProgress(((firstSample / totalSamples) + chan) / channels.length);
      return !stopped;
    });
  }

  void _output(List<List<Note>> chunks) {
    // Calculate RMS volume.
    double sequenceSquareSumVolume = 0;
    for (final chunk in chunks) {
      double chunkSumVolume = 0;
      for (final note in chunk) {
        chunkSumVolume += note.volume;
      }
      sequenceSquareSumVolume += chunkSumVolume * chunkSumVolume;
    }
    final sequenceRmsVolume = sqrt(sequenceSquareSumVolume / chunks.length);

    // Normalize RMS volume, and discard any notes that are too quiet.
    final volumeMul = kMainVolume * config.outputVolume / sequenceRmsVolume;
    for (final chunk in chunks) {
      for (final note in chunk) {
        note.volume *= volumeMul;
        if (note.volume >= config.minVolume) {
          outNotes.add(note);
        }
      }
    }

    done = true;
  }

  String toNoteString() => '$kMagicString:0:'
      '${outNotes.map((n) => n.toNoteString(config)).join(';')};:';

  pb.Sequence toSequence() {
    final seq = pb.Sequence();
    final settings = pb.SequenceSettings();
    settings.bpm = config.bpm;
    for (int chan = 0; chan < channels.length; ++chan) {
      final pan = channels.length == 1
          ? 0.0
          : chan == 0
              ? -1.0
              : 1.0;
      for (int microtoneIndex = 0;
          microtoneIndex < config.microtones;
          ++microtoneIndex) {
        final sinSettings = pb.InstrumentSettings();
        final cloneIndex = getCloneIndex(microtoneIndex, chan);
        final instrument = cloneIndex * kCloneOffset + kInstSin;
        sinSettings.detune =
            config.detune + (microtoneIndex * 100.0 / config.microtones);
        print('${instrument}\t${sinSettings.detune}\t${pan}');
        sinSettings.pan = pan;
        sinSettings.volume = 1;
        settings.instruments[instrument] = sinSettings;
      }
    }
    seq.settings = settings;
    final notes = seq.notes;
    for (final note in outNotes) {
      final n = pb.Note();
      n.type = note.pbType;
      n.time = note.getTimeStep(config);
      n.length = note.getLengthStep(config);
      n.instrument = note.instrument;
      n.volume = note.volume;
      notes.add(n);
    }
    return seq;
  }
}

void onDragOver(MouseEvent e) {
  e.preventDefault();
}

void onDrop(MouseEvent e) {
  e.preventDefault();
  final files = <File>[];
  final n = e.dataTransfer.items?.length ?? 0;
  for (int i = 0; i < n; ++i) {
    final file = e.dataTransfer.items?[i].getAsFile();
    if (file != null) files.add(file);
  }
  setInputFiles(files);
}

void onFile(Event e) => setInputFiles(domInput.files ?? []);

void reportError(String error) {
  domError.innerText = error;
  domSelectedDuration.innerText = '';
}

void setInputFiles(List<File> files) {
  final file = files.firstOrNull;
  if (file == null) return;
  domError.innerText = '';
  domStatus.innerText = '';
  show(domGoRow);
  hide(domOutputRow);
  domSelectedFile.innerText = '${file.name}:';
  if (!file.type.startsWith('audio/wav')) {
    reportError('Not a WAV file.');
    return;
  }
  final reader = new FileReader();
  reader.onLoad.listen((_) {
    final bytes = reader.result;
    if (bytes == null || bytes is! Uint8List) return;
    try {
      final wav = Wav.read(bytes);
      domSelectedDuration.innerText = '${wav.duration.toStringAsFixed(2)} sec'
          ' at ${wav.samplesPerSecond} Hz with ${wav.channels.length} channels';
      activeWav = WavFile(file.name, wav);
    } on FormatException catch (e) {
      reportError(e.message);
    }
  });
  reader.readAsArrayBuffer(file);
}

Future<void> go(MouseEvent e) async {
  final wf = activeWav;
  if (wf == null) return;
  activeJob?.stop();
  final job = FFTJob(wf.wav, wf.name, activeConfig);
  activeJob = job;
  domStatus.innerText = 'Running...';
  hide(domOutputRow);
  await window.animationFrame;
  final timer = Stopwatch();
  timer.start();
  await job.run((double frac) async {
    if (timer.elapsedMilliseconds > 30) {
      timer.reset();
      domStatus.innerText = 'Running... ${(100 * frac).toStringAsFixed(2)}%';
      await window.animationFrame;
    }
  });
  if (!job.done) return;
  domStatus.innerText = 'Done! :) ${job.outNotes.length} notes';
  show(domOutputRow);
  setShown(domCopyButton, job.config.shouldShowCopyNotes);
}

void copyNotes(MouseEvent e) {
  final job = activeJob;
  if (job != null && job.done) {
    window.navigator.clipboard?.writeText(job.toNoteString());
  }
}

Future<void> downloadSequence(MouseEvent e) async {
  final job = activeJob;
  if (job != null && job.done) {
    await saveBlob(
      '${maybeStripSuffix(job.name, '.wav')}.sequence',
      Blob([job.toSequence().writeToBuffer()], 'application/octet-stream'),
    );
  }
}

Future<void> saveBlob(String name, Blob blob) async {
  final a = document.createElement('a') as AnchorElement;
  final url = Url.createObjectUrl(blob);
  a.href = url;
  a.download = name;
  domBody.children.add(a);
  a.click();
  await window.animationFrame;
  domBody.children.remove(a);
  Url.revokeObjectUrl(url);
}

void onMode(Event? e) {
  activeConfig.copyFrom(defaultConfigs[domModeSelect.value]!);
}

void toggleAdvOpt(MouseEvent e) {
  if (isHidden(domAdvOpt)) {
    show(domAdvOpt);
    domAdvOptButton.innerText = '[Hide advanced options]';
  } else {
    hide(domAdvOpt);
    domAdvOptButton.innerText = '[Show advanced options]';
  }
}

class PermissiveValidator implements NodeValidator {
  @override
  bool allowsAttribute(Element element, String attributeName, String value) =>
      true;
  @override
  bool allowsElement(Element element) => true;
}

void setTooltip(String html) {
  domAdvOptRight.setInnerHtml(html, validator: PermissiveValidator());
}

void main() {
  domBody.onDragOver.listen(onDragOver);
  domBody.onDrop.listen(onDrop);
  domInput.onChange.listen(onFile);
  domGoButton.onClick.listen(go);
  domCopyButton.onClick.listen(copyNotes);
  domDownloadButton.onClick.listen(downloadSequence);
  domModeSelect.onChange.listen(onMode);
  domAdvOptButton.onClick.listen(toggleAdvOpt);
  onMode(null);
}
