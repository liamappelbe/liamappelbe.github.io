from collections import OrderedDict
import random
import sys


#################
### CONSTANTS ###
#################

kFreqDictSize = 30000
kTargetCadence = [1, 0, -1, -1, 1, 0, 1]
kTargetPhonemes = []  # ["AO", "L", "Z"]
kIgnoreSecondaryPoS = True


#######################
### DATA STRUCTURES ###
#######################

kFreqDict = set()          # {most common kFreqDictSize words}
kPos = OrderedDict()       # {word: [parts of speech]}
kPro = []                  # [(word, [phoneme strs], [phoneme ids])}
kPhoIds = OrderedDict()    # {phoneme: id}
kPosDict = OrderedDict()   # {part of speech: [words]}
kCadDict = OrderedDict()   # {part of speech: CadDictEntry(cad tree -> [words])}

def randFromList(a):
  return a[random.randrange(len(a))]

def randFromListofLists(a):
  n = sum(len(b) for b in a)
  if n == 0:
    return None
  i = random.randrange(n)
  for b in a:
    if i < len(b):
      return b[i]
    i -= len(b)
  assert(False)

def randFromListofListRanges(a):
  n = sum(j - i for b, i, j in a)
  if n == 0:
    return None, 0
  k = random.randrange(n)
  for b, i, j in a:
    if k < j - i:
      return b[k + i]
    k -= j - i
  assert(False)

class RhymeNode:
  def __init__(self):
    self.ch = [None] * len(kPhoIds)
    self.i = 0
    self.i2 = 0
    self.j = 0
    self.temp = []
  def finish(self, w):
    self.i = len(w)
    w += self.temp
    self.i2 = len(w)
    self.temp = None
    for n in self.ch:
      if n is not None:
        n.finish(w)
    self.j = len(w)

class CadNode:
  def __init__(self):
    self.ch = [None, None, None]
    self.w = None
    self.r = RhymeNode()
  def add(self, w, rr):
    n = self.r
    for p in rr:
      if n.ch[p] is None:
        n.ch[p] = RhymeNode()
      n = n.ch[p]
    n.temp.append((w, len(rr)))
  def finish(self):
    for n in self.ch:
      if n is not None:
        n.finish()
    self.w = []
    self.r.finish(self.w)
  def rhyme(self, rr, z):
    n = self.r
    for p in rr:
      if n != self.r:
        z.append((self.w, n.i, n.i2))
      n = n.ch[p]
      if n is None:
        return
    z.append((self.w, n.i, n.j))

class CadDictEntry:
  def __init__(self):
    self.root = CadNode()
  def add(self, w, a, rr):
    n = self.root
    for p in a:
      k = ord(p[-1]) - ord('0')
      if k < 0 or k > 2:
        continue
      if n.ch[k] is None:
        n.ch[k] = CadNode()
      n = n.ch[k]
    n.add(w, rr)
  def rand(self, c, rr):
    a = [self.root]
    for k in c:
      b = []
      if k == -1:
        for n in a:
          for m in n.ch:
            if m is not None:
              b.append(m)
      else:
        for n in a:
          m = n.ch[k]
          if m is not None:
            b.append(m)
      a = b
    z = []
    for n in a:
      n.rhyme(rr, z)
    return randFromListofListRanges(z)
  def finish(self):
    self.root.finish()


#################
### READ DATA ###
#################
with open(sys.argv[1], "r") as f:
  for l in f:
    if len(kFreqDict) >= kFreqDictSize:
      break
    i = l.rfind(',')
    if i == -1:
      continue
    kFreqDict.add(l[:i].strip().lower())

with open(sys.argv[2], "r", encoding="mac_roman") as f:
  while True:
    l = f.readline()
    if len(l) == 0:
      break
    a = l[:-1].split('\\')
    if len(a) != 2:
      continue
    word = a[0].strip().lower()
    if word not in kFreqDict:
      continue
    if word not in kPos:
      kPos[word] = []
    kPos[word] += [p for p in a[1] if p in "NphVtiAvCP!rD"]

with open(sys.argv[3], "r") as f:
  for l in f:
    l = l.split('#')[0]  # Some lines have comments. Discard them.
    a = l.split(' ')
    assert(a[0].lower() == a[0])
    assert(all(a[i].upper() == a[i] for i in range(1, len(a))))
    word = a[0].split('(')[0]  # Some words have a (2) suffix. Discard it.
    if word not in kFreqDict:
      continue
    a = [p.strip() for p in a[1:] if len(p.strip()) > 0]
    syl = sum(1 if p[-1] in "012" else 0 for p in a)
    if syl == 0:
      continue
    a2 = []
    for p in a:
      if p[-1] in "012":
        p = p[:-1]
      if p not in kPhoIds:
        i = len(kPhoIds)
        kPhoIds[p] = i
      a2.append(kPhoIds[p])
    kPro.append((word, a, [p for p in reversed(a2)]))


##################
### MERGE DATA ###
##################
for word, pro, rr in kPro:
  if word not in kPos:
    continue
  for p in kPos[word]:
    if p not in kCadDict:
      kCadDict[p] = CadDictEntry()
    kCadDict[p].add(word, pro, rr)
    if p not in kPosDict:
      kPosDict[p] = []
    kPosDict[p].append(word)
    if kIgnoreSecondaryPoS:
      break
for e in kCadDict.values():
  e.finish()

#####################
### GRAMMAR RULES ###
#####################

# N   Noun                     apple
# p   Plural                   apples
# h   Noun Phrase              apple cider
# V   Verb (usu participle)    argued
# t   Verb (transitive)        amend
# i   Verb (intransitive)      arrive
# A   Adjective                armored
# v   Adverb                   arrogantly
# C   Conjunction              and
# P   Preposition              among
# I   Interjection             alas
# r   Pronoun                  anyone
# D   Definite Article         another

# S = I? NP VP (C S)?
# NP = (D A* (N | h) | A* p | r) (P NP)?
# VP = v? (i | V) | v? t NP

def randb(pr = 0.5):
  return random.random() < pr

def randw(p, c, rr):
  return kCadDict[p].rand(c, rr)

def randwraw(p):
  return randFromList(kPosDict[p])

def genA():
  a = []
  while randb(0.5 / (1 + 0.8 * len(a))):
    a.append('A')
  return a

def genNP(n = 0):
  a = []
  if randb():
    a.append('D')
    a += genA()
    if randb():
      a.append('N')
    else:
      a.append('h')
  elif randb():
    a += genA()
    a.append('p')
  else:
    a.append('r')
  if randb(0.3 / (n + 1)):
    a.append('P')
    a += genNP(n + 1)
  return a

def genVP():
  a = []
  if randb():
    if randb():
      a.append('v')
    if randb():
      a.append('i')
    else:
      a.append('V')
  else:
    if randb():
      a.append('v')
    a.append('t')
    a += genNP()
  return a

def genPos(n = 0):
  a = []
  a += genNP()
  a += genVP()
  if randb(0.3 / (n + 1)):
    a.append('C')
    a += genPos(n + 1)
  return a


##########################
### SENTENCE GENERATOR ###
##########################
fails = 0
sucesses = 0
def genS(cadence, rhyme):
  global fails
  global sucesses
  rr = [kPhoIds[p] for p in reversed(rhyme)]
  ts = len(cadence)
  while True:
    pos = genPos()
    if len(pos) > ts:
      fails += 1
      continue
    syl = [1] * len(pos)
    for _ in range(ts - len(pos)):
      # This is inefficient if ts is large, but it's fine for now.
      syl[random.randrange(len(syl))] += 1
    a = []
    j, k = len(cadence), 0
    for i in range(len(pos) - 1, -1, -1):
      pj = j
      j -= syl[i]
      w, np = randw(pos[i], cadence[j:pj], rr[k:])
      a.append(w)
      k = min(k + np, len(rr))
    if any(w == None for w in a):
      fails += 1
      continue
    sucesses += 1
    return list(reversed(a))

def genSraw():
  pos = genPos()
  print(pos)
  return [randwraw(p) for p in pos]


########################
### GENERATE RESULTS ###
########################
for i in range(8):
  s = genS(kTargetCadence, kTargetPhonemes)
  # s = genSraw()
  print(' '.join(s) + '\n')
print("Retry rate: %.1fx" % (fails / sucesses))


########################
### GENERATE JS DATA ###
########################
# print("[%s]" % (",".join("[%r,%r,[%s]]" % (
#     word, kPos[word][0], ",".join(repr(p) for p in pro)
#   ) for word, pro, rr in kPro if word in kPos)))

