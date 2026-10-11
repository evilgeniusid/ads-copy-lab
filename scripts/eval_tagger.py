"""Score autotag.mjs against blind gold labels: binary confusion matrix per yes/no tag, accuracy + per-class P/R for angle."""
import json, sys
pred = {x["id"]: x["tags"] for x in json.load(open(sys.argv[1]))}
gold = {x["id"]: x for x in json.load(open(sys.argv[2]))}
ids = sorted(gold)
out = {"n": len(ids)}
for dim in sorted(k for k in next(iter(gold.values())) if k not in ("id", "angle")):
    m = dict(tp=0, fp=0, fn=0, tn=0)
    for i in ids:
        p, g = pred[i][dim] == "yes", gold[i][dim] == "yes"
        m["tp" if p and g else "fp" if p else "fn" if g else "tn"] += 1
    m["precision"] = round(m["tp"] / max(1, m["tp"] + m["fp"]), 2)
    m["recall"] = round(m["tp"] / max(1, m["tp"] + m["fn"]), 2)
    out[dim] = m
hit = sum(pred[i]["angle"] == gold[i]["angle"] for i in ids)
out["angle_accuracy"] = round(hit / len(ids), 2)
cls = {}
for c in sorted({gold[i]["angle"] for i in ids} | {pred[i]["angle"] for i in ids}):
    tp = sum(pred[i]["angle"] == c and gold[i]["angle"] == c for i in ids)
    fp = sum(pred[i]["angle"] == c and gold[i]["angle"] != c for i in ids)
    fn = sum(pred[i]["angle"] != c and gold[i]["angle"] == c for i in ids)
    cls[c] = {"precision": round(tp / max(1, tp + fp), 2), "recall": round(tp / max(1, tp + fn), 2), "support": tp + fn}
out["angle_per_class"] = cls
print(json.dumps(out, indent=1))
