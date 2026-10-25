import sys, re, json, unicodedata, hashlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / '.audit-tools'))
from spylls.hunspell import Dictionary
ROOT = Path(__file__).parent
normalize = lambda s: ''.join(c for c in unicodedata.normalize('NFD', s) if not unicodedata.combining(c)).upper()
old = re.search(r'const words = "([^"]+)"', (ROOT / 'dictionary.js').read_text(encoding='utf-8'))[1].split()
previous = ROOT / 'dictionary-audit.json'
if previous.exists():
    report = json.loads(previous.read_text(encoding='utf-8'))
    old = sorted(set(report['retained']) | set(report['removed']))
wanted = set(old)
h = Dictionary.from_files(str(ROOT / 'auditoria-fontes/pt_BR'))
evidence = {}
def collect(form, stem):
    key = normalize(form)
    if key in wanted and key not in evidence and re.fullmatch('[A-Z]{5}', key) and h.lookup(form):
        evidence[key] = {'spelling': form, 'stem': stem}
for entry in h.dic.words:
    stem = entry.stem
    if not stem.islower() or not stem.isalpha() or len(stem) > 12 or h.aff.FORBIDDENWORD in entry.flags:
        continue
    collect(stem, stem)
    prefixes = []
    suffixes = []
    for flag in entry.flags:
        for rule in h.aff.PFX.get(flag, []):
            if rule.cond_regexp.search(stem) and (not rule.strip or stem.startswith(rule.strip)):
                form = rule.add + stem[len(rule.strip):]
                collect(form, stem)
                if rule.crossproduct: prefixes.append((form, rule))
        for rule in h.aff.SFX.get(flag, []):
            if rule.cond_regexp.search(stem) and (not rule.strip or stem.endswith(rule.strip)):
                form = (stem[:-len(rule.strip)] if rule.strip else stem) + rule.add
                collect(form, stem)
                if rule.crossproduct: suffixes.append(rule)
    for form, prefix in prefixes:
        for rule in suffixes:
            if rule.cond_regexp.search(form) and (not rule.strip or form.endswith(rule.strip)):
                collect((form[:-len(rule.strip)] if rule.strip else form) + rule.add, stem)
kept = sorted(evidence)
report = {'source': 'https://github.com/LibreOffice/dictionaries/tree/master/pt_BR',
 'method': 'Intersection with lowercase VERO entries and Hunspell-validated inflections; accents normalized only after validation. Unconfirmed entries are excluded, not declared nonexistent.',
 'original_count': len(old), 'retained_count': len(kept), 'removed_count': len(wanted-set(kept)),
 'source_sha256': {name: hashlib.sha256((ROOT/'auditoria-fontes'/name).read_bytes()).hexdigest() for name in ['pt_BR.dic','pt_BR.aff']},
 'retained': evidence, 'removed': sorted(wanted-set(kept))}
(ROOT/'dictionary-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['original_count','retained_count','removed_count']}))
