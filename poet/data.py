from collections import OrderedDict
import random
import sys

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
# !   Interjection             alas
# r   Pronoun                  anyone
# D   Definite Article         another

# S = !? NP VP (C S)?
# NP = (D A* (N | h) | A* p | r) (P NP)?
# VP = (i | V) v? | t v? NP

kFreqDictSize = 30000

kFreqDict = set()
kPos = OrderedDict()

with open(sys.argv[2], "r") as f:
  for l in f:
    if len(kFreqDict) >= kFreqDictSize:
      break
    i = l.rfind(',')
    if i == -1:
      continue
    kFreqDict.add(l[:i])

with open(sys.argv[1], "r", encoding="mac_roman") as f:
  while True:
    l = f.readline()
    if len(l) == 0:
      break
    a = l[:-1].split('\\')
    if len(a) != 2:
      continue
    if a[0] not in kFreqDict:
      continue
    for p in a[1]:
      if ord(p) < ord(' ') or ord(p) > ord('~'):
        continue
      if p not in kPos:
        kPos[p] = []
      kPos[p].append(a[0])
      break

def randb(pr = 0.5):
  return random.random() < pr

def randp(p):
  return kPos[p][random.randrange(len(kPos[p]))]

def genA():
  a = []
  while randb(0.7 / (1 + 0.8 * len(a))):
    a.append(randp('A'))
  return a

def genNP(n = 0):
  a = []
  if randb():
    a.append(randp('D'))
    a += genA()
    if randb():
      a.append(randp('N'))
    else:
      a.append(randp('h'))
  elif randb():
    a += genA()
    a.append(randp('p'))
  else:
    a.append(randp('r'))
  if randb(0.5 / (n + 1)):
    a.append(randp('P'))
    a += genNP(n + 1)
  return a

def genVP():
  a = []
  if randb():
    if randb():
      a.append(randp('i'))
    else:
      a.append(randp('V'))
    if randb():
      a.append(randp('v'))
  else:
    a.append(randp('t'))
    if randb():
      a.append(randp('v'))
    a += genNP()
  return a

def genS(n = 0):
  a = []
  if randb(0.3 if n == 0 else 0):
    a.append(randp('!') + random.choice(['.', '!', '?', '...']))
  a += genNP()
  a += genVP()
  if randb(0.5 / (n + 1)):
    a.append(randp('C'))
    a += genS(n + 1)
  return a

for i in range(10):
  print(' '.join(genS()) + '\n')
