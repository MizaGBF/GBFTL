import httpx
import concurrent.futures
from threading import Lock
import json
from bs4 import BeautifulSoup
import sys
from copy import deepcopy
from datetime import datetime, timezone

class TL():
    def __init__(self):
        try:
            with open("list.json", mode="rb") as f:
                self.data = json.load(f)
        except:
            self.data = {}
        self.lock = Lock()
        self.client = httpx.Client(http2=True, limits=httpx.Limits(max_keepalive_connections=100, max_connections=100, keepalive_expiry=10))

    def updateIndex(self, nchar=None):
        nthread = 25
        with concurrent.futures.ThreadPoolExecutor(max_workers=nthread) as executor:
            try:
                last = (int(list(self.data.keys())[-1].split(' ')[0]) // 1000) % 1000
            except:
                last = 0
            queue = []
            new = []
            if nchar is None:
                nchar = 10
                for i in range(0, last+nchar):
                    cid = str(3040000000 + i * 1000)
                    if (cid + ' 4' in self.data and self.data[cid + ' 4'].get('Name', '???') != '???') or cid == "3040097000": continue
                    queue.append(cid)
            else:
                for i in range(0, last+nchar):
                    cid = str(3040000000 + i * 1000)
                    if cid + ' 4' in self.data or cid == "3040097000": continue
                    queue.append(cid)
            print("Attempting to update", len(queue), "element(s)")
            futures = [executor.submit(self.update_sub, queue, new) for i in range(nthread)]
            for future in concurrent.futures.as_completed(futures):
                future.result()
            print("Checking results...")
            if len(new) > 0:
                tmp = {}
                keys = list(self.data.keys())
                keys.sort()
                for k in keys:
                    tmp[k] = self.data[k]
                self.data = tmp
                with open("list.json", mode="w", encoding="utf-8") as f:
                    json.dump(self.data, f, ensure_ascii=False)
                print("list.json has been updated.")
            print("Done.")

    def manualUpdate(self, cids):
        nthread = 25
        with concurrent.futures.ThreadPoolExecutor(max_workers=nthread) as executor:
            queue = []
            new = []
            for cid in cids:
                if len(cid) == 10 and cid.startswith('304') and cid != "3040097000":
                    queue.append(cid)
            print("Attempting to update", len(queue), "element(s)")
            futures = [executor.submit(self.update_sub, queue, new) for i in range(nthread)]
            for future in concurrent.futures.as_completed(futures):
                future.result()
            print("Checking results...")
            if len(new) > 0:
                tmp = {}
                keys = list(self.data.keys())
                keys.sort()
                for k in keys:
                    tmp[k] = self.data[k]
                self.data = tmp
                with open("list.json", mode="w", encoding="utf-8") as f:
                    json.dump(self.data, f, ensure_ascii=False)
                print("list.json has been updated.")
            print("Done.")
        

    def update_sub(self, queue, new):
        while True:
            with self.lock:
                if len(queue) == 0: return
                cid = queue.pop()
            for uncap in ['_04', '_04_s2', '_03', '_03_s2', '_02', '_02_s2', '']:
                if uncap == '':
                    break
                elif self.request("https://prd-game-a-granbluefantasy.akamaized.net/assets/js_low/model/manifest/npc_{}{}.js".format(cid, uncap)) is not None:
                    break
            match uncap:
                case '_04'|'_04_s2': uncap = 6
                case '_03'|'_03_s2': uncap = 5
                case '_02'|'_02_s2': uncap = 4
                case '': continue
            try:
                data = self.getData(cid, uncap)
                with self.lock:
                    new.append(cid)
                    if cid+' 4' in self.data:
                        print("Updated Element:", cid)
                        data['Rating'] = self.data[cid + ' 4']['Rating']
                        self.data[cid + ' 4'] = data
                    else:
                        print("New Element:", cid)
                        self.data[cid + ' 4'] = data
            except Exception as e:
                print(e)

    def getData(self, cid, uncap):
        data = {'Name':'???', 'Nickname':'', 'Uncap':uncap, 'Rating':None, 'Series':[]}
        r = self.request("https://gbf.wiki/index.php?search={}".format(cid))
        if r is not None:
            try: content = r.content.decode('utf-8')
            except: content = r.content.decode('iso-8859-1')
            soup = BeautifulSoup(content, 'html.parser')
            try:
                res = soup.find_all("ul", class_="mw-search-results")[0].findChildren("li", class_="mw-search-result", recursive=False) # recuperate the search results
                m = None
                for r in res: # for each, get the title
                    m = r.findChildren("div", class_="mw-search-result-heading", recursive=False)[0].findChildren("a", recursive=False)[0].attrs['title']
                    break
                if m is not None:
                    r = self.request("https://gbf.wiki/{}".format(m.replace(' ', '_')))
                    try: content = r.content.decode('utf-8')
                    except: content = r.content.decode('iso-8859-1')
                    soup = BeautifulSoup(content, 'html.parser')
                    tables = soup.find_all("table", class_='wikitable') # iterate all wikitable
                    data['Name'] = self.cleanName(m)
                    data['Wiki'] = m
                    for t in tables:
                        try:
                            body = t.findChildren("tbody", recursive=False)[0].findChildren("tr" , recursive=False) # check for tr tag
                            for tr in body:
                                for k in ["Race", "Element", "Style", "Specialty", "Gender", "JP"]:
                                    if str(tr).find(k) != -1 and k not in data:
                                        a = str(tr).find("/Category:")
                                        if k == "Specialty":
                                            while a != -1:
                                                a += len("/Category:")
                                                b= str(tr).find("_", a)
                                                if k not in data: data[k] = []
                                                s = str(tr)[a:b]
                                                if s not in data[k]:
                                                    data[k].append(s)
                                                a = str(tr).find("/Category:", b)
                                        elif k == "Race":
                                            while a != -1:
                                                a += len("/Category:")
                                                b= str(tr).find("_", a)
                                                s = str(tr)[a:b]
                                                if "Type" not in data: data["Type"] = []
                                                if s not in data["Type"]:
                                                    data["Type"].append(s)
                                                a = str(tr).find("/Category:", b)
                                        elif k == "Gender":
                                            if "Male" in str(tr): data[k] = "Male"
                                            elif "Female" in str(tr): data[k] = "Female"
                                            elif "Other" in str(tr): data[k] = "Other"
                                            break
                                        elif k == "JP":
                                            try: data['JP'] = tr.findChildren("td" , recursive=False)[0].text
                                            except: pass
                                            break
                                        elif a != -1:
                                            a += len("/Category:")
                                            b= str(tr).find("_", a)
                                            data[k] = str(tr)[a:b]
                                            break
                        except:
                            pass
                        # series
                        try:
                            imgs = t.findChildren("img", recursive=True)
                            for img in imgs:
                                if img.has_attr('alt') and 'Series' in img.attrs['alt']:
                                    data['Series'].append(img.attrs['alt'].split(' ')[1])
                        except:
                            pass
            except Exception as e:
                print(e)
        return data

    def request(self, url, follow_redirects=False):
        try:
            r = self.client.get(url, headers={"Connection":"keep-alive"}, follow_redirects=follow_redirects)
            if r.status_code != 200: return None
            return r
        except:
            return None

    def cleanName(self, name):
        for k in ['(Grand)', '(Yukata)', '(Summer)', '(Valentine)', '(Holiday)', '(Halloween)', '(SSR)', '(Fire)', '(Water)', '(Earth)', '(Wind)', '(Light)', '(Dark)', '(Grand)', '(Event SSR)', '(Event)', '(Promo)']:
            name = name.replace(k, '')
        return name.strip()

    def fixEternal(self):
        cids = ['3040030000', '3040031000', '3040032000', '3040033000', '3040034000', '3040035000', '3040036000', '3040037000', '3040038000', '3040039000']
        uncap = [
            ('5', "(5★)", 5),
            ('6_1', "(6★ Lv110)", 6),
            ('6_3', "(6★ Lv130)", 6),
            ('6_5', "(6★ Lv150)", 6)
        ]
        for cid in cids:
            if cid + ' 4' in self.data:
                base = self.data[cid + ' 4']
                base['Uncap'] = 4
                for u in uncap:
                    if cid + ' ' + u[0] not in self.data:
                        self.data[cid + ' ' + u[0]] = deepcopy(base)
                        self.data[cid + ' ' + u[0]]['Name'] += ' ' + u[1]
                        self.data[cid + ' ' + u[0]]['Uncap'] = u[2]
        tmp = {}
        keys = list(self.data.keys())
        keys.sort()
        for k in keys:
            tmp[k] = self.data[k]
        self.data = tmp
        with open("list.json", mode="w", encoding="utf-8") as f:
            json.dump(self.data, f, ensure_ascii=False)
        print("Done.")

    def fixStyle(self):
        cids = ['3040088000']
        for cid in cids:
            if cid + 's2' not in self.data:
                self.data[cid + 's2'] = self.getData(cid + "_st2", 0)
        tmp = {}
        keys = list(self.data.keys())
        keys.sort()
        for k in keys:
            tmp[k] = self.data[k]
        self.data = tmp
        with open("list.json", mode="w", encoding="utf-8") as f:
            json.dump(self.data, f, ensure_ascii=False)
        print("Done.")

    def generateRating(self):
        with open("generation.txt", mode="r") as f:
            r = f.read().replace('\r', '').split('\n')
        for e in r:
            if e == '': continue
            s = e.split(' ')
            if len(s) == 2:
                cid = s[0]
                uncap = ''
                rating = s[1]
            elif len(s) == 3:
                cid = s[0]
                uncap = ' ' + str(s[1])
                rating = s[2]
            if rating == "None": continue
            if cid + uncap in self.data:
                self.data[cid + uncap]["Rating"] = int(rating)
        with open("list.json", mode="w", encoding="utf-8") as f:
            json.dump(self.data, f, ensure_ascii=False)
        self.changelog()
        print("Done.")

    def nickname(self):
        modified = False
        while True:
            a = input("Add a nickname to which character? (Leave blank to quit):").lower()
            if a == "": break
            keys = []
            for k, v in self.data.items():
                if a == v['Name'].lower():
                    keys.append(k)
            if len(keys) == 0:
                print("No characters found with this name")
                continue
            else:
                print(len(keys), "character(s) found")
            a = input("Input the nickname to set for those characters:").lower()
            for k in keys:
                self.data[k]['Nickname'] = a
            modified = True
        if modified:
            with open("list.json", mode="w", encoding="utf-8") as f:
                json.dump(self.data, f, ensure_ascii=False)
        print("Done.")

    def changelog(self, new=[]):
        with open("changelog.json", mode="w", encoding="utf-8") as f:
            json.dump({'timestamp':int(datetime.now(timezone.utc).timestamp()*1000), 'new':new}, f, ensure_ascii=False)
        print("changelog.json has been updated")

if __name__ == "__main__":
    t = TL()
    if '-init' in sys.argv:
        t.updateIndex(450)
        t.fixEternal()
        t.fixStyle()
    elif '-fix' in sys.argv:
        t.fixEternal()
        t.fixStyle()
    elif '-rate' in sys.argv:
        t.generateRating()
    elif '-nick' in sys.argv:
        t.nickname()
    elif sys.argv[1] == '-update':
        if len(sys.argv) == 2:
            print("Please add character IDs")
        else:
            t.manualUpdate(sys.argv[2:])
    else:
        t.updateIndex()