// constant
var tierlist = null;
var changelog = [];
var counter = 0;
var total = 0;

function init()
{
    loadFile('changelog.json?' + Date.now(), init2, init2);
}

function init2()
{
    try{
        let json = JSON.parse(this.response);
        let date = (new Date(json['timestamp'])).toISOString();
        document.getElementById('timestamp').innerHTML += " " + date.split('T')[0] + " " + date.split('T')[1].split(':').slice(0, 2).join(':') + " UTC";
        changelog = json['new'];
    }catch{
        document.getElementById('timestamp').innerHTML = "";
        changelog = [];
    }
    loadFile('list.json?' + Date.now(), success, failed);
}

function loadFile(url, callback, err_callback) {
    var xhr = new XMLHttpRequest();
    xhr.ontimeout = function () {
        err_callback.apply(xhr);
    };
    xhr.onload = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback.apply(xhr);
            } else {
                err_callback.apply(xhr);
            }
        }
    };
    xhr.open("GET", url, true);
    xhr.timeout = 1000;
    xhr.send(null);
}

function failed()
{
    
}

function success()
{
    tierlist = JSON.parse(this.response);
    let entries = ["Character", "Name", "Uncap", "Element", "Series", "Specialty", "Style", "Type", "Gender", "Rating"];
    // header
    let table_header = document.getElementById('table-header').children[0];
    for(let k of entries)
    {
        let new_th = document.createElement('th');
        new_th.colspan = "1";
        switch(k)
        {
            case "Character":
                new_th.id = "cell-id";
                break;
            case "Name":
                new_th.id = "cell-name";
                break;
            case "Uncap":
                new_th.id = "cell-uncap";
                break;
            case "Element":
                new_th.id = "cell-element";
                break;
            case "Series":
                new_th.id = "cell-series";
                break;
            case "Specialty":
                new_th.id = "cell-specialty";
                break;
            case "Style":
                new_th.id = "cell-style";
                break;
            case "Type":
                new_th.id = "cell-type";
                break;
            case "Gender":
                new_th.id = "cell-gender";
                k = "♂♀";
                break;
            case "Rating":
                new_th.id = "cell-rating";
                break;
            default:
                new_th.id = "cell-other";
                break;
        }
        new_th.appendChild(document.createTextNode(k));
        table_header.appendChild(new_th);
    }
    // body
    let table_content = document.getElementById('table-content');
    for(const [key, value] of Object.entries(tierlist))
    {
        let new_tr = document.createElement('tr');
        new_tr.setAttribute('index_key', key);
        counter++;
        for(let k of entries)
        {
            let new_td = document.createElement('td');
            switch(k)
            {
                case "Character":
                {
                    new_td.id = "cell-id";
                    let ref = document.createElement('a');
                    let id = key.split(' ');
                    let uncap = "_01";
                    let style = "";
                    if(key.endsWith('s2'))
                    {
                        id = key.replace('s2', '');
                        style = '_st2';
                    }
                    else if("Uncap" in value && value["Uncap"] > 4)
                    {
                        if(value["Uncap"] == 5) uncap = "_03";
                        else if(value["Uncap"] == 6) uncap = "_04";
                        id = id[0];
                    }
                    else if(id.length > 1)
                    {
                        if(id[1][0] == '5') uncap = "_03";
                        else if(id[1][0] == '6') uncap = "_04";
                        id = id[0];
                    }
                    if("Wiki" in value)
                        ref.setAttribute('href', "https://gbf.wiki/" + value["Wiki"]);
                    else
                        ref.setAttribute('href', "https://gbf.wiki/index.php?search=" + id + style);
                    let img = document.createElement('img');
                    img.setAttribute('onerror', "this.onerror=null;this.src='assets/ui/dummy.jpg';");
                    img.src = 'https://prd-game-a1-granbluefantasy.akamaized.net/assets_en/img_low/sp/assets/npc/m/' + id + uncap + style + '.jpg';
                    img.alt = id + uncap + style;
                    img.title = id;
                    img.onload = setImgStyle(img, "width:140px;");
                    img.loading = "lazy";
                    ref.appendChild(img);
                    new_td.appendChild(ref);
                    if(changelog.includes(id)) new_tr.className = "new";
                    new_td.setAttribute('sorttable_customkey', img.alt);
                    break;
                }
                case "Name":
                {
                    new_td.id = "cell-name";
                    let bold = document.createElement('strong');
                    let textnode = document.createTextNode(value["Name"]); 
                    bold.appendChild(textnode); 
                    new_td.className = "clickable";
                    new_td.setAttribute("onclick", 'updateFilter("'+value["Name"]+'");');
                    new_td.appendChild(bold);
                    new_td.setAttribute('sorttable_customkey', value["Name"].toLowerCase());
                    break;
                }
                case "Uncap":
                {
                    new_td.id = "cell-uncap";
                    if(value['Uncap'] != 0)
                    {
                        let img = document.createElement('img');
                        img.className = "clickable";
                        switch(value['Uncap'])
                        {
                            case '5': case 5: img.src = 'assets/stars/5.png'; img.alt = '5★'; new_td.setAttribute('sorttable_customkey', "flb"); img.setAttribute("onclick", 'updateFilter("flb");'); break;
                            case '6': case 6: img.src = 'assets/stars/6.png'; img.alt = '6★'; new_td.setAttribute('sorttable_customkey', "ulb"); img.setAttribute("onclick", 'updateFilter("ulb");'); break;
                            default: img.src = 'assets/stars/4.png'; img.alt = '4★'; new_td.setAttribute('sorttable_customkey', "mlb"); img.setAttribute("onclick", 'updateFilter("mlb");'); break;
                        }
                        img.title = img.alt;
                        img.onload = setImgStyle(img, "width:70px");
                        img.loading = "lazy";
                        new_td.appendChild(img);
                    }
                    break;
                }
                case "Element":
                {
                    new_td.id = "cell-element";
                    if("Element" in value)
                    {
                        let img = document.createElement('img');
                        img.src = 'assets/elements/' + value["Element"].toLowerCase() + '.png';
                        img.alt = value["Element"].toLowerCase();
                        img.title = value["Element"];
                        img.onload = setImgStyle(img, "width:80px;");
                        img.loading = "lazy";
                        img.className = "clickable";
                        img.setAttribute("onclick", 'updateFilter("'+value["Element"].toLowerCase()+'");');
                        new_td.appendChild(img);
                        switch(img.alt)
                        {
                            case "fire": new_td.setAttribute('sorttable_customkey', "0"); break;
                            case "water": new_td.setAttribute('sorttable_customkey', "1"); break;
                            case "earth": new_td.setAttribute('sorttable_customkey', "2"); break;
                            case "wind": new_td.setAttribute('sorttable_customkey', "3"); break;
                            case "light": new_td.setAttribute('sorttable_customkey', "4"); break;
                            case "dark": new_td.setAttribute('sorttable_customkey', "5"); break;
                            default: new_td.setAttribute('sorttable_customkey', "6"); break;
                        }
                        new_td.setAttribute('sorttable_customkey', value["Element"].toLowerCase());
                    }
                    break;
                }
                case "Series":
                {
                    new_td.id = "cell-series";
                    if("Series" in value)
                    {
                        let istyle = "width:50px";
                        if(value["Series"].length >= 2) istyle = "width:25px";
                        for(let j = 0; j < value["Series"].length; ++j)
                        {
                            let img = document.createElement('img');
                            img.src = 'assets/series/' + value["Series"][j].toLowerCase() + '.png';
                            img.className = "clickable";
                            img.setAttribute("onclick", 'updateFilter("'+(value["Series"][j]=='12'?'12 Generals':value["Series"][j].toLowerCase())+'", 0);');
                            img.alt = (value["Series"][j]=='12'?'12 Generals':value["Series"][j].toLowerCase());
                            img.title = (value["Series"][j]=='12'?'12 Generals':value["Series"][j]);
                            img.onload = setImgStyle(img, istyle);
                            img.loading = "lazy";
                            new_td.appendChild(img);
                        }
                        new_td.setAttribute('sorttable_customkey', value["Series"].join().toLowerCase());
                    }
                    break;
                }
                case "Specialty":
                {
                    if("Specialty" in value)
                    {
                        let istyle = "width:40px";
                        for(let j = 0; j < value["Specialty"].length; ++j)
                        {
                            let img = document.createElement('img');
                            img.src = 'assets/specialties/' + value["Specialty"][j].toLowerCase() + '.png';
                            img.title = value["Specialty"][j].charAt(0).toUpperCase() + value["Specialty"][j].slice(1);
                            img.alt = value["Specialty"][j].toLowerCase();
                            img.className = "clickable";
                            img.setAttribute("onclick", 'updateFilter("'+value["Specialty"][j].toLowerCase()+'", 1);');
                            img.onload = setImgStyle(img, istyle);
                            img.loading = "lazy";
                            new_td.appendChild(img);
                        }
                        new_td.setAttribute('sorttable_customkey', value["Specialty"].join().toLowerCase());
                    }
                    break;
                }
                case "Style":
                {
                    if("Style" in value)
                    {
                        new_td.id = "cell-style";
                        var img = document.createElement('img');
                        img.src = 'assets/styles/' + value["Style"].toLowerCase() + '.png';
                        img.alt = value["Style"].toLowerCase();
                        img.className = "clickable";
                        img.setAttribute("onclick", 'updateFilter("'+value["Style"].toLowerCase()+'");');
                        img.title = value["Style"];
                        img.onload = setImgStyle(img, "width:50px;");
                        img.loading = "lazy";
                        new_td.appendChild(img);
                    }
                    break;
                }
                case "Type":
                {
                    if("Type" in value)
                    {
                        new_td.id = "cell-type";
                        var istyle = "width:50px";
                        if(value["Type"].length >= 2) istyle = "width:25px";
                        for(var j = 0; j < value["Type"].length; ++j)
                        {
                            var img = document.createElement('img');
                            img.src = 'assets/types/' + value["Type"][j].toLowerCase() + '.png';
                            img.alt = value["Type"][j].toLowerCase();
                            img.className = "clickable";
                            img.setAttribute("onclick", 'updateFilter("'+value["Type"][j].toLowerCase()+'", 2);');
                            img.title = value["Type"][j];
                            img.onload = setImgStyle(img, istyle);
                            img.loading = "lazy";
                            new_td.appendChild(img);
                        }
                        new_td.setAttribute('sorttable_customkey', value["Type"].join().toLowerCase());
                    }
                    break;
                }
                case "Gender":
                {
                    new_td.id = "cell-gender";
                    var img = document.createElement('img');
                    img.src = 'assets/genders/' + value["Gender"].toLowerCase() + '.png';
                    img.className = "clickable";
                    if(value['Gender'] == 'Other')
                    {
                        img.alt = 'unknown';
                        img.setAttribute("onclick", 'updateFilter("unknown");');
                        img.title = "Unknown";
                    }
                    else
                    {
                        img.alt = value["Gender"].toLowerCase();
                        img.setAttribute("onclick", 'updateFilter("'+value["Gender"].toLowerCase()+'");');
                        img.title = value["Gender"];
                    }
                    img.onload = setImgStyle(img, "width:40px;");
                    img.loading = "lazy";
                    new_td.appendChild(img);
                    break;
                }
                case "Rating":
                {
                    new_td.id = "cell-rating";
                    let r = JSON.stringify(value["Rating"]).toLowerCase();
                    let custom_key = "";
                    let img = document.createElement('img');
                    img.onload = setImgStyle(img, "width:80px");
                    img.loading = "lazy";
                    img.src = 'assets/ratings/' + r + '.png';
                    switch(r)
                    {
                        case '4': custom_key = r; r = "Core"; break;
                        case '3': custom_key = r; r = "Good"; break;
                        case '2': custom_key = r; r = "Niche"; break;
                        case '1': custom_key = r; r = "Trash"; break;
                        default: custom_key = "0"; r = "Not Rated"; break;
                    }
                    img.alt = r;
                    img.className = "clickable";
                    img.setAttribute("onclick", 'updateFilter("'+r+'");');
                    img.title = r;
                    new_td.appendChild(img);
                    new_td.setAttribute('sorttable_customkey', custom_key);
                    break;
                }
                default:
                    new_td.id = "cell-other";
                    new_td.appendChild(document.createTextNode("Debug"));
                    break;
            }
            new_tr.appendChild(new_td);
        }
        table_content.appendChild(new_tr);
    }
    for(const k in tierlist)
    {
        let stringified = k.slice(0, 10) + " " + tierlist[k]["Name"] + " " + tierlist[k]["JP"] + " " + tierlist[k]["Nickname"] + " " + tierlist[k]["Element"] + " " + tierlist[k]["Type"].join(' ') + " " + tierlist[k]["Style"];
        if(tierlist[k]["Gender"] == 'Other') stringified += " unknown genderless";
        else stringified += " " + tierlist[k]["Gender"];
        for(const e in tierlist[k]["Specialty"])
        {
            switch(tierlist[k]["Specialty"][e])
            {
                case "Sabre": stringified += " sabre sword"; break;
                case "Melee": stringified += " melee fist"; break;
                case "Staff": stringified += " staff stick"; break;
                default: stringified += " " + tierlist[k]["Specialty"][e]; break;
            }
        }
        for(const e in tierlist[k]["Series"])
        {
            switch(tierlist[k]["Series"][e])
            {
                case "12": stringified += " 12 generals zodiac"; break;
                default: stringified += " " + tierlist[k]["Series"][e]; break;
            }
        }
        switch(tierlist[k]["Uncap"])
        {
            case '5': case 5: stringified += " flb 5"; break;
            case '6': case 6: stringified += " ulb 6 transcendence transcended"; break;
            default: stringified += " mlb 4"; break;
        }
        switch(tierlist[k]["Rating"])
        {
            case 1: stringified += " trash"; break;
            case 2: stringified += " niche"; break;
            case 3: stringified += " good"; break;
            case 4: stringified += " core"; break;
            default: stringified += " not rated"; break;
        }
        if(changelog.includes(k.slice(0, 10))) stringified += " updated";
        tierlist[k] = stringified.toLowerCase();
    }
    total = counter;
    document.getElementById("counter").innerHTML = counter + " characters";
    sorttable.init();
    let params = new URLSearchParams(window.location.search);
    let filterterms = params.get("filter");
    if(filterterms != null)
    {
        document.getElementById("filter").value = filterterms;
        filter();
    }
}

function setImgStyle(img, style)
{
    if(style != undefined) img.style = style;
}

function filter() {
    let values = document.getElementById('filter').value.trim();
    let params = new URLSearchParams(window.location.search);
    let filterterms = params.get("filter");
    if(filterterms != null && values === "")
    {
        params.delete("filter");
        let newRelativePathQuery = window.location.pathname;
        history.pushState(null, '', newRelativePathQuery);
    }
    else if(values != filterterms && values !== "")
    {
        params.set("filter", values);
        let newRelativePathQuery = window.location.pathname + '?' + params.toString();
        history.pushState(null, '', newRelativePathQuery);
    }
    values = values.toLowerCase();
    let rows = document.getElementById("table-content").children;
    if(values === "")
    {
        for(let i = 0; i < rows.length; ++i)
        {
            unhide(rows[i]);
        }
        counter = total;
        document.getElementById("counter").innerHTML = counter + " characters";
    }
    else
    {
        values = values.split(' ');
        counter = 0;
        for(let i = 0; i < rows.length; ++i)
        {
            let index_key = rows[i].getAttribute("index_key");
            let character = tierlist[index_key];
            let result = true;
            for(let v of values)
            {
                let b;
                if(v.startsWith('-')) b = !character.includes(v.slice(1));
                else b = character.includes(v);
                result = result & b;
                if(!result) break;
            }
            if(result) unhide(rows[i]);
            else hide(rows[i]);
        }
        document.getElementById("counter").innerHTML = counter + " results / " + total + " characters";
    }
}

function hide(element) {
    if(element.id === "") element.id = "hidden";
    else if(!element.id.includes("hidden")) element.id += " hidden";
}

function unhide(element) {
    counter++;
    if(element.id === "hidden") element.id = "";
    else if(element.id.includes("hidden"))
    {
        let el = element.id.split(' ');
        element.id = "";
        for(const e of el)
        {
            if(e === "hidden") continue;
            element.id += e + " ";
        }
    }
}

function updateFilter(word, multi = null) {
    let params = new URLSearchParams(window.location.search);
    let filterterms = params.get("filter");
    if(filterterms == null) filterterms = "";
    filterterms = filterterms.trim().replace(/\s\s+/g, ' ').split(" ");
    word = word.toLowerCase().split(" ");
    switch(multi) // special filter
    {
        case 0:
            for(const i in filterterms)
            {
                if(['12', 'generals', 'zodiac', 'zodiacs', 'eternal', 'eternals', 'fantasy', 'grand', 'halloween', 'holiday', 'summer', 'tie-in', 'event', 'valentine', 'yukata'].includes(filterterms[i].toLowerCase()))
                    filterterms[i] = '';
            }
            break;
        case 1:
            for(const i in filterterms)
            {
                if(['axe', 'bow', 'dagger', 'gun', 'eternal', 'harp', 'katana', 'melee', 'fist', 'sabre', 'sword', 'spear', 'staff', 'stick'].includes(filterterms[i].toLowerCase()))
                    filterterms[i] = '';
            }
            break;
        case 2:
            for(const i in filterterms)
            {
                if(['draph', 'harvin', 'erune', 'human', 'other', 'primal'].includes(filterterms[i].toLowerCase()))
                    filterterms[i] = '';
            }
            break;
        default:
            break;
    };
    for(const j in word)
    {
        let done = 0;
        for(const i in filterterms)
        {
            if(filterterms[i].toLowerCase() == word[j])
            {
                if(done > 0) filterterms[i] = '';
                ++done;
            }
        }
        if(done == 0) filterterms.push(word[j]);
        console.log(word, filterterms, done);
    }
    document.getElementById("filter").value = filterterms.join(' ').trim().replace(/\s\s+/g, ' ');
    filter();
}