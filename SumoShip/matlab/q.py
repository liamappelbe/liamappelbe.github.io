import random

# Q-learning.
def Qup(setQ, getQ, p, a, r, s, learnRate, discountFactor, allAct):
  setQ(p, a, (1 - learnRate) * getQ(p, a) + learnRate * (r + discountFactor * max([getQ(s, b) for b in allAct(s)])))

def epsGreedy(getQ, s, epsilon, allAct):
  a = allAct(s)
  if random.random() < epsilon:
    return random.choice(a)
  else:
    return max(a, key = lambda x: getQ(s, x))



# Q table. TODO: replace this with a neural net.
Q = {}
def getQ(s, a):
  global Q
  if (s, a) in Q:
    return Q[(s, a)]
  return 0

def setQ(s, a, value):
  global Q
  Q[(s, a)] = value



# Environment definition.
"""
+-+-+-+
|8 7 E|
+ +-+-+
|5 4|3|
+ +-+ +
|2 1 S|
+-+-+-+
"""
A = {0: [3, 1], 1: [0, 2], 2: [1, 5], 3: [0], 4: [5], 5: [2, 4, 8], 6: [0], 7: [6, 8], 8: [5, 7]}
def allAct(s):
  global A
  return A[s]

def reward(s):
  return 100 if s == 6 else -1

def next(s, a):
  return a



# Run it all.
ep = 0
s = 0
for i in xrange(2000):
  ep = ep + 1
  a = epsGreedy(getQ, s, 0.01, allAct)
  p = s
  s = next(s, a)
  r = reward(s)
  if r > 0:
    print ep
    ep = 0
  Qup(setQ, getQ, p, a, r, s, 0.01, 0.9, allAct)
