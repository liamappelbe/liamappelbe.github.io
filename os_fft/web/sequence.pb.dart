///
//  Generated code. Do not modify.
//  source: sequence.proto
//
// @dart = 2.12
// ignore_for_file: annotate_overrides,camel_case_types,constant_identifier_names,directives_ordering,library_prefixes,non_constant_identifier_names,prefer_final_fields,return_of_invalid_type,unnecessary_const,unnecessary_import,unnecessary_this,unused_import,unused_shown_name

import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'note_type.pbenum.dart' as $0;

class Note extends $pb.GeneratedMessage {
  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      const $core.bool.fromEnvironment('protobuf.omit_message_names')
          ? ''
          : 'Note',
      createEmptyInstance: create)
    ..e<$0.NoteType>(
        1,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'type',
        $pb.PbFieldType.OE,
        defaultOrMaker: $0.NoteType.C0,
        valueOf: $0.NoteType.valueOf,
        enumValues: $0.NoteType.values)
    ..a<$core.double>(
        2,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'time',
        $pb.PbFieldType.OF)
    ..a<$core.double>(
        3,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'length',
        $pb.PbFieldType.OF)
    ..a<$core.int>(
        4,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'instrument',
        $pb.PbFieldType.O3)
    ..a<$core.double>(
        5,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'volume',
        $pb.PbFieldType.OF)
    ..hasRequiredFields = false;

  Note._() : super();
  factory Note({
    $0.NoteType? type,
    $core.double? time,
    $core.double? length,
    $core.int? instrument,
    $core.double? volume,
  }) {
    final _result = create();
    if (type != null) {
      _result.type = type;
    }
    if (time != null) {
      _result.time = time;
    }
    if (length != null) {
      _result.length = length;
    }
    if (instrument != null) {
      _result.instrument = instrument;
    }
    if (volume != null) {
      _result.volume = volume;
    }
    return _result;
  }
  factory Note.fromBuffer($core.List<$core.int> i,
          [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(i, r);
  factory Note.fromJson($core.String i,
          [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(i, r);
  @$core.Deprecated('Using this can add significant overhead to your binary. '
      'Use [GeneratedMessageGenericExtensions.deepCopy] instead. '
      'Will be removed in next major version')
  Note clone() => Note()..mergeFromMessage(this);
  @$core.Deprecated('Using this can add significant overhead to your binary. '
      'Use [GeneratedMessageGenericExtensions.rebuild] instead. '
      'Will be removed in next major version')
  Note copyWith(void Function(Note) updates) =>
      super.copyWith((message) => updates(message as Note))
          as Note; // ignore: deprecated_member_use
  $pb.BuilderInfo get info_ => _i;
  @$core.pragma('dart2js:noInline')
  static Note create() => Note._();
  Note createEmptyInstance() => create();
  static $pb.PbList<Note> createRepeated() => $pb.PbList<Note>();
  @$core.pragma('dart2js:noInline')
  static Note getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Note>(create);
  static Note? _defaultInstance;

  @$pb.TagNumber(1)
  $0.NoteType get type => $_getN(0);
  @$pb.TagNumber(1)
  set type($0.NoteType v) {
    setField(1, v);
  }

  @$pb.TagNumber(1)
  $core.bool hasType() => $_has(0);
  @$pb.TagNumber(1)
  void clearType() => clearField(1);

  @$pb.TagNumber(2)
  $core.double get time => $_getN(1);
  @$pb.TagNumber(2)
  set time($core.double v) {
    $_setFloat(1, v);
  }

  @$pb.TagNumber(2)
  $core.bool hasTime() => $_has(1);
  @$pb.TagNumber(2)
  void clearTime() => clearField(2);

  @$pb.TagNumber(3)
  $core.double get length => $_getN(2);
  @$pb.TagNumber(3)
  set length($core.double v) {
    $_setFloat(2, v);
  }

  @$pb.TagNumber(3)
  $core.bool hasLength() => $_has(2);
  @$pb.TagNumber(3)
  void clearLength() => clearField(3);

  @$pb.TagNumber(4)
  $core.int get instrument => $_getIZ(3);
  @$pb.TagNumber(4)
  set instrument($core.int v) {
    $_setSignedInt32(3, v);
  }

  @$pb.TagNumber(4)
  $core.bool hasInstrument() => $_has(3);
  @$pb.TagNumber(4)
  void clearInstrument() => clearField(4);

  @$pb.TagNumber(5)
  $core.double get volume => $_getN(4);
  @$pb.TagNumber(5)
  set volume($core.double v) {
    $_setFloat(4, v);
  }

  @$pb.TagNumber(5)
  $core.bool hasVolume() => $_has(4);
  @$pb.TagNumber(5)
  void clearVolume() => clearField(5);
}

class Marker extends $pb.GeneratedMessage {
  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      const $core.bool.fromEnvironment('protobuf.omit_message_names')
          ? ''
          : 'Marker',
      createEmptyInstance: create)
    ..a<$core.double>(
        1,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'time',
        $pb.PbFieldType.OF)
    ..a<$core.int>(
        2,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'setting',
        $pb.PbFieldType.O3)
    ..a<$core.int>(
        3,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'instrument',
        $pb.PbFieldType.O3)
    ..a<$core.double>(
        4,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'value',
        $pb.PbFieldType.OF)
    ..aOB(
        5,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'blend')
    ..hasRequiredFields = false;

  Marker._() : super();
  factory Marker({
    $core.double? time,
    $core.int? setting,
    $core.int? instrument,
    $core.double? value,
    $core.bool? blend,
  }) {
    final _result = create();
    if (time != null) {
      _result.time = time;
    }
    if (setting != null) {
      _result.setting = setting;
    }
    if (instrument != null) {
      _result.instrument = instrument;
    }
    if (value != null) {
      _result.value = value;
    }
    if (blend != null) {
      _result.blend = blend;
    }
    return _result;
  }
  factory Marker.fromBuffer($core.List<$core.int> i,
          [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(i, r);
  factory Marker.fromJson($core.String i,
          [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(i, r);
  @$core.Deprecated('Using this can add significant overhead to your binary. '
      'Use [GeneratedMessageGenericExtensions.deepCopy] instead. '
      'Will be removed in next major version')
  Marker clone() => Marker()..mergeFromMessage(this);
  @$core.Deprecated('Using this can add significant overhead to your binary. '
      'Use [GeneratedMessageGenericExtensions.rebuild] instead. '
      'Will be removed in next major version')
  Marker copyWith(void Function(Marker) updates) =>
      super.copyWith((message) => updates(message as Marker))
          as Marker; // ignore: deprecated_member_use
  $pb.BuilderInfo get info_ => _i;
  @$core.pragma('dart2js:noInline')
  static Marker create() => Marker._();
  Marker createEmptyInstance() => create();
  static $pb.PbList<Marker> createRepeated() => $pb.PbList<Marker>();
  @$core.pragma('dart2js:noInline')
  static Marker getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Marker>(create);
  static Marker? _defaultInstance;

  @$pb.TagNumber(1)
  $core.double get time => $_getN(0);
  @$pb.TagNumber(1)
  set time($core.double v) {
    $_setFloat(0, v);
  }

  @$pb.TagNumber(1)
  $core.bool hasTime() => $_has(0);
  @$pb.TagNumber(1)
  void clearTime() => clearField(1);

  @$pb.TagNumber(2)
  $core.int get setting => $_getIZ(1);
  @$pb.TagNumber(2)
  set setting($core.int v) {
    $_setSignedInt32(1, v);
  }

  @$pb.TagNumber(2)
  $core.bool hasSetting() => $_has(1);
  @$pb.TagNumber(2)
  void clearSetting() => clearField(2);

  @$pb.TagNumber(3)
  $core.int get instrument => $_getIZ(2);
  @$pb.TagNumber(3)
  set instrument($core.int v) {
    $_setSignedInt32(2, v);
  }

  @$pb.TagNumber(3)
  $core.bool hasInstrument() => $_has(2);
  @$pb.TagNumber(3)
  void clearInstrument() => clearField(3);

  @$pb.TagNumber(4)
  $core.double get value => $_getN(3);
  @$pb.TagNumber(4)
  set value($core.double v) {
    $_setFloat(3, v);
  }

  @$pb.TagNumber(4)
  $core.bool hasValue() => $_has(3);
  @$pb.TagNumber(4)
  void clearValue() => clearField(4);

  @$pb.TagNumber(5)
  $core.bool get blend => $_getBF(4);
  @$pb.TagNumber(5)
  set blend($core.bool v) {
    $_setBool(4, v);
  }

  @$pb.TagNumber(5)
  $core.bool hasBlend() => $_has(4);
  @$pb.TagNumber(5)
  void clearBlend() => clearField(5);
}

class InstrumentSettings extends $pb.GeneratedMessage {
  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      const $core.bool.fromEnvironment('protobuf.omit_message_names')
          ? ''
          : 'InstrumentSettings',
      createEmptyInstance: create)
    ..a<$core.double>(
        1,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'volume',
        $pb.PbFieldType.OF)
    ..aOB(
        2,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'delay')
    ..aOB(
        3,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'reverb')
    ..a<$core.double>(
        4,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'pan',
        $pb.PbFieldType.OF)
    ..aOB(
        5,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'enableEq')
    ..a<$core.double>(
        6,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'eqLow',
        $pb.PbFieldType.OF)
    ..a<$core.double>(
        7,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'eqMid',
        $pb.PbFieldType.OF)
    ..a<$core.double>(
        8,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'eqHigh',
        $pb.PbFieldType.OF)
    ..a<$core.double>(
        9,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'detune',
        $pb.PbFieldType.OF)
    ..a<$core.int>(
        10,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'reverbType',
        $pb.PbFieldType.O3)
    ..a<$core.double>(
        11,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'oneMinusReverbVolume',
        $pb.PbFieldType.OF)
    ..a<$core.int>(
        12,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'distortType',
        $pb.PbFieldType.O3)
    ..a<$core.double>(
        13,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'distortVolume',
        $pb.PbFieldType.OF)
    ..hasRequiredFields = false;

  InstrumentSettings._() : super();
  factory InstrumentSettings({
    $core.double? volume,
    $core.bool? delay,
    $core.bool? reverb,
    $core.double? pan,
    $core.bool? enableEq,
    $core.double? eqLow,
    $core.double? eqMid,
    $core.double? eqHigh,
    $core.double? detune,
    $core.int? reverbType,
    $core.double? oneMinusReverbVolume,
    $core.int? distortType,
    $core.double? distortVolume,
  }) {
    final _result = create();
    if (volume != null) {
      _result.volume = volume;
    }
    if (delay != null) {
      _result.delay = delay;
    }
    if (reverb != null) {
      _result.reverb = reverb;
    }
    if (pan != null) {
      _result.pan = pan;
    }
    if (enableEq != null) {
      _result.enableEq = enableEq;
    }
    if (eqLow != null) {
      _result.eqLow = eqLow;
    }
    if (eqMid != null) {
      _result.eqMid = eqMid;
    }
    if (eqHigh != null) {
      _result.eqHigh = eqHigh;
    }
    if (detune != null) {
      _result.detune = detune;
    }
    if (reverbType != null) {
      _result.reverbType = reverbType;
    }
    if (oneMinusReverbVolume != null) {
      _result.oneMinusReverbVolume = oneMinusReverbVolume;
    }
    if (distortType != null) {
      _result.distortType = distortType;
    }
    if (distortVolume != null) {
      _result.distortVolume = distortVolume;
    }
    return _result;
  }
  factory InstrumentSettings.fromBuffer($core.List<$core.int> i,
          [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(i, r);
  factory InstrumentSettings.fromJson($core.String i,
          [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(i, r);
  @$core.Deprecated('Using this can add significant overhead to your binary. '
      'Use [GeneratedMessageGenericExtensions.deepCopy] instead. '
      'Will be removed in next major version')
  InstrumentSettings clone() => InstrumentSettings()..mergeFromMessage(this);
  @$core.Deprecated('Using this can add significant overhead to your binary. '
      'Use [GeneratedMessageGenericExtensions.rebuild] instead. '
      'Will be removed in next major version')
  InstrumentSettings copyWith(void Function(InstrumentSettings) updates) =>
      super.copyWith((message) => updates(message as InstrumentSettings))
          as InstrumentSettings; // ignore: deprecated_member_use
  $pb.BuilderInfo get info_ => _i;
  @$core.pragma('dart2js:noInline')
  static InstrumentSettings create() => InstrumentSettings._();
  InstrumentSettings createEmptyInstance() => create();
  static $pb.PbList<InstrumentSettings> createRepeated() =>
      $pb.PbList<InstrumentSettings>();
  @$core.pragma('dart2js:noInline')
  static InstrumentSettings getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<InstrumentSettings>(create);
  static InstrumentSettings? _defaultInstance;

  @$pb.TagNumber(1)
  $core.double get volume => $_getN(0);
  @$pb.TagNumber(1)
  set volume($core.double v) {
    $_setFloat(0, v);
  }

  @$pb.TagNumber(1)
  $core.bool hasVolume() => $_has(0);
  @$pb.TagNumber(1)
  void clearVolume() => clearField(1);

  @$pb.TagNumber(2)
  $core.bool get delay => $_getBF(1);
  @$pb.TagNumber(2)
  set delay($core.bool v) {
    $_setBool(1, v);
  }

  @$pb.TagNumber(2)
  $core.bool hasDelay() => $_has(1);
  @$pb.TagNumber(2)
  void clearDelay() => clearField(2);

  @$pb.TagNumber(3)
  $core.bool get reverb => $_getBF(2);
  @$pb.TagNumber(3)
  set reverb($core.bool v) {
    $_setBool(2, v);
  }

  @$pb.TagNumber(3)
  $core.bool hasReverb() => $_has(2);
  @$pb.TagNumber(3)
  void clearReverb() => clearField(3);

  @$pb.TagNumber(4)
  $core.double get pan => $_getN(3);
  @$pb.TagNumber(4)
  set pan($core.double v) {
    $_setFloat(3, v);
  }

  @$pb.TagNumber(4)
  $core.bool hasPan() => $_has(3);
  @$pb.TagNumber(4)
  void clearPan() => clearField(4);

  @$pb.TagNumber(5)
  $core.bool get enableEq => $_getBF(4);
  @$pb.TagNumber(5)
  set enableEq($core.bool v) {
    $_setBool(4, v);
  }

  @$pb.TagNumber(5)
  $core.bool hasEnableEq() => $_has(4);
  @$pb.TagNumber(5)
  void clearEnableEq() => clearField(5);

  @$pb.TagNumber(6)
  $core.double get eqLow => $_getN(5);
  @$pb.TagNumber(6)
  set eqLow($core.double v) {
    $_setFloat(5, v);
  }

  @$pb.TagNumber(6)
  $core.bool hasEqLow() => $_has(5);
  @$pb.TagNumber(6)
  void clearEqLow() => clearField(6);

  @$pb.TagNumber(7)
  $core.double get eqMid => $_getN(6);
  @$pb.TagNumber(7)
  set eqMid($core.double v) {
    $_setFloat(6, v);
  }

  @$pb.TagNumber(7)
  $core.bool hasEqMid() => $_has(6);
  @$pb.TagNumber(7)
  void clearEqMid() => clearField(7);

  @$pb.TagNumber(8)
  $core.double get eqHigh => $_getN(7);
  @$pb.TagNumber(8)
  set eqHigh($core.double v) {
    $_setFloat(7, v);
  }

  @$pb.TagNumber(8)
  $core.bool hasEqHigh() => $_has(7);
  @$pb.TagNumber(8)
  void clearEqHigh() => clearField(8);

  @$pb.TagNumber(9)
  $core.double get detune => $_getN(8);
  @$pb.TagNumber(9)
  set detune($core.double v) {
    $_setFloat(8, v);
  }

  @$pb.TagNumber(9)
  $core.bool hasDetune() => $_has(8);
  @$pb.TagNumber(9)
  void clearDetune() => clearField(9);

  @$pb.TagNumber(10)
  $core.int get reverbType => $_getIZ(9);
  @$pb.TagNumber(10)
  set reverbType($core.int v) {
    $_setSignedInt32(9, v);
  }

  @$pb.TagNumber(10)
  $core.bool hasReverbType() => $_has(9);
  @$pb.TagNumber(10)
  void clearReverbType() => clearField(10);

  @$pb.TagNumber(11)
  $core.double get oneMinusReverbVolume => $_getN(10);
  @$pb.TagNumber(11)
  set oneMinusReverbVolume($core.double v) {
    $_setFloat(10, v);
  }

  @$pb.TagNumber(11)
  $core.bool hasOneMinusReverbVolume() => $_has(10);
  @$pb.TagNumber(11)
  void clearOneMinusReverbVolume() => clearField(11);

  @$pb.TagNumber(12)
  $core.int get distortType => $_getIZ(11);
  @$pb.TagNumber(12)
  set distortType($core.int v) {
    $_setSignedInt32(11, v);
  }

  @$pb.TagNumber(12)
  $core.bool hasDistortType() => $_has(11);
  @$pb.TagNumber(12)
  void clearDistortType() => clearField(12);

  @$pb.TagNumber(13)
  $core.double get distortVolume => $_getN(12);
  @$pb.TagNumber(13)
  set distortVolume($core.double v) {
    $_setFloat(12, v);
  }

  @$pb.TagNumber(13)
  $core.bool hasDistortVolume() => $_has(12);
  @$pb.TagNumber(13)
  void clearDistortVolume() => clearField(13);
}

class SequenceSettings extends $pb.GeneratedMessage {
  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      const $core.bool.fromEnvironment('protobuf.omit_message_names')
          ? ''
          : 'SequenceSettings',
      createEmptyInstance: create)
    ..a<$core.int>(
        1,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'bpm',
        $pb.PbFieldType.O3)
    ..a<$core.int>(
        2,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'timeSignature',
        $pb.PbFieldType.O3)
    ..m<$core.int, InstrumentSettings>(
        3,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'instruments',
        entryClassName: 'SequenceSettings.InstrumentsEntry',
        keyFieldType: $pb.PbFieldType.O3,
        valueFieldType: $pb.PbFieldType.OM,
        valueCreator: InstrumentSettings.create)
    ..a<$core.double>(
        4,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'oneMinusVolume',
        $pb.PbFieldType.OF)
    ..hasRequiredFields = false;

  SequenceSettings._() : super();
  factory SequenceSettings({
    $core.int? bpm,
    $core.int? timeSignature,
    $core.Map<$core.int, InstrumentSettings>? instruments,
    $core.double? oneMinusVolume,
  }) {
    final _result = create();
    if (bpm != null) {
      _result.bpm = bpm;
    }
    if (timeSignature != null) {
      _result.timeSignature = timeSignature;
    }
    if (instruments != null) {
      _result.instruments.addAll(instruments);
    }
    if (oneMinusVolume != null) {
      _result.oneMinusVolume = oneMinusVolume;
    }
    return _result;
  }
  factory SequenceSettings.fromBuffer($core.List<$core.int> i,
          [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(i, r);
  factory SequenceSettings.fromJson($core.String i,
          [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(i, r);
  @$core.Deprecated('Using this can add significant overhead to your binary. '
      'Use [GeneratedMessageGenericExtensions.deepCopy] instead. '
      'Will be removed in next major version')
  SequenceSettings clone() => SequenceSettings()..mergeFromMessage(this);
  @$core.Deprecated('Using this can add significant overhead to your binary. '
      'Use [GeneratedMessageGenericExtensions.rebuild] instead. '
      'Will be removed in next major version')
  SequenceSettings copyWith(void Function(SequenceSettings) updates) =>
      super.copyWith((message) => updates(message as SequenceSettings))
          as SequenceSettings; // ignore: deprecated_member_use
  $pb.BuilderInfo get info_ => _i;
  @$core.pragma('dart2js:noInline')
  static SequenceSettings create() => SequenceSettings._();
  SequenceSettings createEmptyInstance() => create();
  static $pb.PbList<SequenceSettings> createRepeated() =>
      $pb.PbList<SequenceSettings>();
  @$core.pragma('dart2js:noInline')
  static SequenceSettings getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SequenceSettings>(create);
  static SequenceSettings? _defaultInstance;

  @$pb.TagNumber(1)
  $core.int get bpm => $_getIZ(0);
  @$pb.TagNumber(1)
  set bpm($core.int v) {
    $_setSignedInt32(0, v);
  }

  @$pb.TagNumber(1)
  $core.bool hasBpm() => $_has(0);
  @$pb.TagNumber(1)
  void clearBpm() => clearField(1);

  @$pb.TagNumber(2)
  $core.int get timeSignature => $_getIZ(1);
  @$pb.TagNumber(2)
  set timeSignature($core.int v) {
    $_setSignedInt32(1, v);
  }

  @$pb.TagNumber(2)
  $core.bool hasTimeSignature() => $_has(1);
  @$pb.TagNumber(2)
  void clearTimeSignature() => clearField(2);

  @$pb.TagNumber(3)
  $core.Map<$core.int, InstrumentSettings> get instruments => $_getMap(2);

  @$pb.TagNumber(4)
  $core.double get oneMinusVolume => $_getN(3);
  @$pb.TagNumber(4)
  set oneMinusVolume($core.double v) {
    $_setFloat(3, v);
  }

  @$pb.TagNumber(4)
  $core.bool hasOneMinusVolume() => $_has(3);
  @$pb.TagNumber(4)
  void clearOneMinusVolume() => clearField(4);
}

class Sequence extends $pb.GeneratedMessage {
  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      const $core.bool.fromEnvironment('protobuf.omit_message_names')
          ? ''
          : 'Sequence',
      createEmptyInstance: create)
    ..aOM<SequenceSettings>(
        1,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'settings',
        subBuilder: SequenceSettings.create)
    ..pc<Note>(
        2,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'notes',
        $pb.PbFieldType.PM,
        subBuilder: Note.create)
    ..pc<Marker>(
        3,
        const $core.bool.fromEnvironment('protobuf.omit_field_names')
            ? ''
            : 'markers',
        $pb.PbFieldType.PM,
        subBuilder: Marker.create)
    ..hasRequiredFields = false;

  Sequence._() : super();
  factory Sequence({
    SequenceSettings? settings,
    $core.Iterable<Note>? notes,
    $core.Iterable<Marker>? markers,
  }) {
    final _result = create();
    if (settings != null) {
      _result.settings = settings;
    }
    if (notes != null) {
      _result.notes.addAll(notes);
    }
    if (markers != null) {
      _result.markers.addAll(markers);
    }
    return _result;
  }
  factory Sequence.fromBuffer($core.List<$core.int> i,
          [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(i, r);
  factory Sequence.fromJson($core.String i,
          [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(i, r);
  @$core.Deprecated('Using this can add significant overhead to your binary. '
      'Use [GeneratedMessageGenericExtensions.deepCopy] instead. '
      'Will be removed in next major version')
  Sequence clone() => Sequence()..mergeFromMessage(this);
  @$core.Deprecated('Using this can add significant overhead to your binary. '
      'Use [GeneratedMessageGenericExtensions.rebuild] instead. '
      'Will be removed in next major version')
  Sequence copyWith(void Function(Sequence) updates) =>
      super.copyWith((message) => updates(message as Sequence))
          as Sequence; // ignore: deprecated_member_use
  $pb.BuilderInfo get info_ => _i;
  @$core.pragma('dart2js:noInline')
  static Sequence create() => Sequence._();
  Sequence createEmptyInstance() => create();
  static $pb.PbList<Sequence> createRepeated() => $pb.PbList<Sequence>();
  @$core.pragma('dart2js:noInline')
  static Sequence getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Sequence>(create);
  static Sequence? _defaultInstance;

  @$pb.TagNumber(1)
  SequenceSettings get settings => $_getN(0);
  @$pb.TagNumber(1)
  set settings(SequenceSettings v) {
    setField(1, v);
  }

  @$pb.TagNumber(1)
  $core.bool hasSettings() => $_has(0);
  @$pb.TagNumber(1)
  void clearSettings() => clearField(1);
  @$pb.TagNumber(1)
  SequenceSettings ensureSettings() => $_ensure(0);

  @$pb.TagNumber(2)
  $core.List<Note> get notes => $_getList(1);

  @$pb.TagNumber(3)
  $core.List<Marker> get markers => $_getList(2);
}
