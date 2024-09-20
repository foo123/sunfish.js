# run as: python nnue-pickle-to-json.py tanh.pickle > tanh.json
import sys, os, json, pickle
import numpy as np

def parse_model(model):
    if isinstance(model, bytes):
        return np.frombuffer(model, dtype=np.int8) / 127.0, None
    elif isinstance(model, (list, tuple)):
        nn = []
        no = None
        for a in model:
            if isinstance(a, bytes): nn.append(np.frombuffer(a, dtype=np.int8) / 127.0)
            elif isinstance(a, (list, tuple)): nn.append(a)
            elif isinstance(a, (int, float)): nn.append([a])
            else:
                if no is None: no = []
                no.append(a)
        return nn, no
    elif isinstance(model, dict):
        nn = {}
        no = None
        for k,a in model.items():
            nn[k], _ = parse_model(a)
            if _ is not None:
                if no is None: no = {}
                no[k] = _
        return nn, no
    else:
        return model, None


# read and parse pickle model
model, _ = parse_model(pickle.load(open(os.path.abspath(sys.argv[1]), "br")))

scale = model['scale'] if 'scale' in model else 1.0
nn = model['ars'] if 'ars' in model else model

L0, L1, L2 = 10, 10, 10
# pos_emb, comb, piece_val, comb_col layers0-1
layer1, layer2 = nn[4].reshape(L2, 2 * L1 - 2), nn[5].reshape(1, L2)
# Pad the position embedding to fit with our 10x12 board
pad = np.pad(nn[0].reshape(8, 8, 6)[::-1], ((2, 2), (1, 1), (0, 0))).reshape(120, 6)
# Combine piece table and pos table into one piece-square table
pst = np.einsum("sd,odp->pso", pad, nn[1].reshape(L0, 6, 6))
pst = np.einsum("psd,odc->cpso", pst, nn[3].reshape(L0, L0, 2))
pst = dict(zip("PNBRQKpnbrqk", pst.reshape(12, 120, L0)))
pst["."] = [[0]*L0] * 120

MATE = 100000
# Since move ordering uses the lower-case version, we need to include the
# mate score in it, since otherwise we wouldn't find checks in QS search.
pst['K'][:, 0] += MATE//2
pst['k'][:, 0] -= MATE//2

for k,v in pst.items(): pst[k] = v if isinstance(v, (list,tuple,dict)) else v.tolist()

# output json pst model
print(json.dumps({'pst':pst,'layer1':layer1.tolist(),'layer2':layer2.tolist(),'scale':scale}))
