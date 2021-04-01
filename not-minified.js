// display a confirmation before navigating away
window.addEventListener('beforeunload', function(e) {
    e.preventDefault();
    e.returnValue = '';
});

const VERSION = 5;
let db;

function openDBandWrite() {
    console.log("Encountered Error, attempting to recover");
    let openRequest = indexedDB.open("db", VERSION);
    openRequest.onsuccess = function(event) {
        console.log("Success creating/accessing IndexedDB database");
        db = openRequest.result;
        db.onerror = function() {
            console.log("Error creating/accessing IndexedDB database");
        };
        let objectStore = db.transaction(['ObjectStore'], "readwrite").objectStore('ObjectStore');

        let objectPutRequest = objectStore.put(container, "container");
        objectPutRequest.onsuccess = () => {
            showMessage("Created Cache", "palegreen");
        };
    }

    openRequest.onupgradeneeded = function(event) {
        db = openRequest.result;
        // data.createObjectStore('ObjectStore');
        db.createObjectStore('ObjectStore');
    };

    openRequest.onerror = function() {
        console.error("Error", openRequest.error);
    };
}

function openDBandRead() {
    let openRequest = indexedDB.open("db", VERSION);
    openRequest.onsuccess = function(event) {
        db = openRequest.result;
        db.onerror = function() {
            console.log("Error creating/accessing IndexedDB database");
        };
        let objectStore = db.transaction(['ObjectStore'], "readonly").objectStore('ObjectStore');
        const objectReadRequest = objectStore.get("container");
        objectReadRequest.onsuccess = () => {
            const data = objectReadRequest.result;
            if (data === undefined) {
                showMessage("No Data Found", "red");
            } else {
                container = data;
                showMessage("Cache Success", "palegreen");
                renderFirst()
                switchContainers()
            }
        }
    }
    openRequest.onupgradeneeded = function(event) {
        db = openRequest.result;
        db.createObjectStore('ObjectStore');
    };
    openRequest.onerror = function() {
        console.error("Error", openRequest.error);
    };

}

function storeData() {
    if (db == undefined) {
        openDBandWrite()
    } else {
        let objectStore = db.transaction(['ObjectStore'], "readwrite").objectStore('ObjectStore');

        let objectPutRequest = objectStore.put(container, "container");
        objectPutRequest.onsuccess = () => {
            showMessage("Updated Cache", "palegreen");
        };
    }
}

function showMessage(string, color) {
    document.getElementById("messages").style.color = color;
    document.getElementById("messages").innerText = string;
    setTimeout(() => {
        document.getElementById("messages").innerText = "Participation";
        document.getElementById("messages").style.color = "rgb(224,224,224)";
    }, 2000);
}

// map container of (period, array in the current sort position(first, last, points, init_points, init alpha pos))
var container;
var current_sort = 'alpha';
var sorts = new Map();
var search_array;
var search_period;
var is_search = false;

class Student {
    constructor(first, last, points) {
        this.first = first;
        this.last = last;
        this.points = parseInt(points);
        this.init_points = parseInt(points);
        this.alpha_pos = 0;
    }
}

function readFile(evt) {
    var f = evt.target.files[0];
    if (f) {
        var r = new FileReader();
        r.onload = function(e) {
            var content_string = e.target.result;
            var array_objects = $.csv.toObjects(content_string)
            var temp_container = new Map()
            for (var index in array_objects) {
                var student = array_objects[index];
                if (!temp_container.has(student.period)) {
                    temp_container.set(student.period, new Array(new Student(student.first, student.last, student.points)));
                } else {
                    var array = temp_container.get(student.period);
                    array.push(new Student(student.first, student.last, student.points));
                }
            }
            container = new Map([...temp_container.entries()].sort());
            renderFirst()
            switchContainers()
            storeData();
        };
        return r.readAsText(f);
    }
}

function readText() {
    var array_objects = $.csv.toObjects(document.getElementById('textarea').value)
    var temp_container = new Map()
    for (var index in array_objects) {
        var student = array_objects[index];
        if (!temp_container.has(student.period)) {
            temp_container.set(student.period, new Array(new Student(student.first, student.last, student.points)));
        } else {
            var array = temp_container.get(student.period);
            array.push(new Student(student.first, student.last, student.points));
            sorts.set(student.period, 'alpha');
        }
    }
    container = new Map([...temp_container.entries()].sort());
    renderFirst()
    switchContainers()
    storeData()
}

function switchContainers() {
    document.getElementById('first-container').hidden = true;
    document.getElementById('second-container').hidden = false;
}

function sortAlpha() {
    for (var [, array] of container) {
        array.sort((a, b) => {
            if (a.last.toUpperCase() == b.last.toUpperCase()) {
                return a.first.toUpperCase() < b.first.toUpperCase() ? -1 : 1;
            } else {
                return a.last.toUpperCase() < b.last.toUpperCase() ? -1 : 1;
            }
        });
        for (var index in array) {
            array[index].alpha_pos = index;
        }
    }
}

//* will call the rerenderer. 
function sortAlphaTab(period) {
    var array;
    if (is_search) {
        array = search_array;
    } else {
        array = container.get(period.toString());
    }
    array.sort((a, b) => {
        if (a.last.toUpperCase() == b.last.toUpperCase()) {
            return a.first.toUpperCase() < b.first.toUpperCase() ? -1 : 1;
        } else {
            return a.last.toUpperCase() < b.last.toUpperCase() ? -1 : 1;
        }
    });
    current_sort = 'alpha';
    sorts.set(period, 'alpha');
    rerender(period);
}

function sortDescendTab(period) {
    var array;
    if (is_search) {
        array = search_array;
    } else {
        array = container.get(period.toString());
    }
    array.sort((a, b) => {
        if ((b.points - b.init_points) - (a.points - a.init_points) == 0) {
            if (a.last.toUpperCase() == b.last.toUpperCase()) {
                return a.first.toUpperCase() < b.first.toUpperCase() ? -1 : 1;
            } else {
                return a.last.toUpperCase() < b.last.toUpperCase() ? -1 : 1;
            }
        } else {
            return (b.points - b.init_points) - (a.points - a.init_points)
        }
    })
    current_sort = 'descend';
    sorts.set(period, 'descend');
    rerender(period);
}

function sortAscendTab(period) {
    var array;
    if (is_search) {
        array = search_array;
    } else {
        array = container.get(period.toString());
    }
    array.sort((a, b) => {
        if (a.points - b.points == 0) {
            if (a.last.toUpperCase() == b.last.toUpperCase()) {
                return a.first.toUpperCase() < b.first.toUpperCase() ? -1 : 1;
            } else {
                return a.last.toUpperCase() < b.last.toUpperCase() ? -1 : 1;
            }
        } else {
            return a.points - b.points
        }
    })
    current_sort = 'ascend';
    sorts.set(period, 'ascend');
    rerender(period);
}

function rerender(period) {
    // fixed height
    let height = 60;
    if (is_search) {
        for (let index in search_array) {
            let student = search_array[index];
            let element = document.getElementById(`${student.first}-${student.last}-${search_period}-row`);
            // if (height == 0) {
            //     height = -1;
            //     element.style.transform = `translateY(${element.offsetHeight * (index - student.alpha_pos)}px)`;
            // } else if (height == -1) {
            //     height = element.offsetHeight;
            //     element.style.transform = `translateY(${height * (index - student.alpha_pos)}px)`;
            // } else {
            // }
            element.style.transform = `translateY(${height * (index - student.alpha_pos)}px)`;
            element.style.zIndex = `${ search_array.size - index}`;
        }
    } else {
        // for (let [period, array] of container) {
        let array = container.get(period);
        for (let index in array) {
            let student = array[index];
            let element = document.getElementById(`${student.first}-${student.last}-${period}-row`);
            // if (height == 0) {
            //     height = -1;
            //     element.style.transform = `translateY(${element.offsetHeight * (index - student.alpha_pos)}px)`;
            // } else if (height == -1) {
            //     height = element.offsetHeight;
            //     element.style.transform = `translateY(${height * (index - student.alpha_pos)}px)`;
            // } else {
            //     element.style.transform = `translateY(${height * (index - student.alpha_pos)}px)`;
            // }
            element.style.transform = `translateY(${height * (index - student.alpha_pos)}px)`;
            element.style.zIndex = `${ array.size - index}`;
        }
    }
    // }
}

function rerenderAfterTabSearch(period) {
    is_search = false;
    $(`#list-group-${period}`).empty();
    var array = container.get(period.toString());
    for (const value of array) {
        $('#list-group-' + period).append(`
            <li id="${value.first}-${value.last}-${period}-row"class="list-group-item d-flex">
                <span class="flex-grow-1" style="text-align: center;">${value.first} ${value.last}</span>
                <span id="${value.first}-${value.last}-${period}-change" style="text-align: center; width: 75px;">+0</span>
                <input id="${value.first}-${value.last}-${period}-input" type="number" value="${value.points}" placeholder="0" min="0" step="1" style="text-align: center;width: 75px;" onclick="updateScore(event)">
            </li>
        `)
        let color, string;
        if (value.points - value.init_points > 0) {
            color = "green";
            string = `+${value.points - value.init_points}`;
        } else if (value.points - value.init_points < 0) {
            color = "red";
            string = `${value.points - value.init_points}`;
        } else {
            color = "grey";
            string = "+0";
        }
        document.getElementById(`${value.first}-${value.last}-${period}-change`).innerHTML = string;
        document.getElementById(`${value.first}-${value.last}-${period}-change`).style.color = color;
    }
}

function rerenderDuringTabSearch(period, search) {
    if (search.length == 0) {
        rerenderAfterTabSearch(period);
        return
    }
    $(`#list-group-${period}`).empty();
    search_array = [];
    search_period = period;
    var array = container.get(period.toString());
    for (const value of array) {
        if (value.first.toUpperCase().includes(search.toUpperCase()) || value.last.toUpperCase().includes(search.toUpperCase())) {
            let temp = Object.assign({}, value);
            temp.alpha_pos = search_array.length;
            search_array.push(temp);
            $('#list-group-' + period).append(`
                <li id="${value.first}-${value.last}-${period}-row" class="list-group-item d-flex">
                    <span class="flex-grow-1" style="text-align: center;">${value.first} ${value.last}</span>
                    <span id="${value.first}-${value.last}-${period}-change" style="text-align: center; width: 75px;">+0</span>
                    <input id="${value.first}-${value.last}-${period}-input" type="number" value="${value.points}" placeholder="0" min="0" step="1" style="text-align: center;width: 75px;" onclick="updateScore(event)">
                </li>
            `)
            let color, string;
            if (value.points - value.init_points > 0) {
                color = "green";
                string = `+${value.points - value.init_points}`;
            } else if (value.points - value.init_points < 0) {
                color = "red";
                string = `${value.points - value.init_points}`;
            } else {
                color = "grey";
                string = "+0";
            }
            document.getElementById(`${value.first}-${value.last}-${period}-change`).innerHTML = string;
            document.getElementById(`${value.first}-${value.last}-${period}-change`).style.color = color;
        }
    }
    is_search = true;
}

function switchTab(period) {
    is_search = false;
    let string = document.getElementById(`${period}-searchbar`).value;
    if (string != 0) {
        is_search = true;
        rerenderDuringTabSearch(period, string);
    }
    current_sort = sorts.get(period);
}

function updateScore(e) {
    let [first, last, period, ] = e.target.id.split('-');
    let target;
    if (is_search) {
        target = search_array.find(student => student.first == first && student.last == last);
        container.get(period).find(student => student.first == first && student.last == last).points = parseInt(e.target.value);
    } else {
        target = container.get(period).find(student => student.first == first && student.last == last);
    }
    target.points = parseInt(e.target.value);
    if (target.points - target.init_points > 0) {
        document.getElementById(`${target.first}-${target.last}-${period}-change`).innerHTML = `+${target.points - target.init_points}`;
        document.getElementById(`${target.first}-${target.last}-${period}-change`).style.color = "green";
    } else if (target.points - target.init_points < 0) {
        document.getElementById(`${target.first}-${target.last}-${period}-change`).innerHTML = `${target.points - target.init_points}`;
        document.getElementById(`${target.first}-${target.last}-${period}-change`).style.color = "red";
    } else {
        document.getElementById(`${target.first}-${target.last}-${period}-change`).innerHTML = `+0`;
        document.getElementById(`${target.first}-${target.last}-${period}-change`).style.color = "grey";
    }
    storeData();
    switch (current_sort) {
        case 'alpha':
            sortAlphaTab(period)
            break;
        case 'descend':
            sortDescendTab(period)
            break;
        case 'ascend':
            sortAscendTab(period)
            break;

        default:
            break;
    }
}

function renderFirst() {
    sortAlpha();
    var is_first_tab = true;
    for (var [period, array] of container) {
        if (is_first_tab) {
            // tabs
            $('#tablist').append(`
                <li class="nav-item" role="presentation">
                    <a onclick="switchTab('${period}')" class="nav-link active" role="tab" data-toggle="tab" href="#tab-${period}">Period ${period}</a>
                </li>
            `);
            // tab control content
            $('#tab-content').append(`
                <div class="tab-pane fade show active" role="tabpanel" id="tab-${period}">
                    <input id="${period}-searchbar" oninput="rerenderDuringTabSearch('${period}', event.target.value)" type="search" class="form-control-lg" style="width: 100%;color: rgb(45,46,55);border: 1px solid rgb(67,67,67);text-align: center; height: 5vh;" placeholder="Search Names" />
                    <div class="btn-group btn-group-toggle d-flex" data-toggle="buttons" style="height: 5vh">
                        <label class="btn btn-outline-primary active" for="btnradio1-${period}" style="border-radius: 0;" onclick=sortAlphaTab('${period}')>
                            <input type="radio" name="btnradio-${period}" checked id="btnradio1-${period}">
                            A -> Z
                        </label>
                        <label class="btn btn-outline-primary" for="btnradio2-${period}" style="border-radius: 0;" onclick=sortDescendTab('${period}')>
                            <input type="radio" class="btn-check" name="btnradio-${period}" id="btnradio2-${period}">
                            +4, ..., -5
                        </label>
                        <label class="btn btn-outline-primary" for="btnradio3-${period}" style="border-radius: 0;" onclick=sortAscendTab('${period}')>
                            <input type="radio" name="btnradio-${period}" id="btnradio3-${period}">
                            1, 2, ...
                        </label>
                    </div>
                    <ul class="list-group text-monospace border rounded-0" id="list-group-${period}" style="height: 60vh;overflow-y: auto;">
                        
                    </ul>
                </div>
            `)
            is_first_tab = false;
        } else {
            // tabs
            $('#tablist').append(`
                <li class="nav-item" role="presentation">
                    <a onclick="switchTab('${period}')" class="nav-link" role="tab" data-toggle="tab" href="#tab-${period}">Period ${period}</a>
                </li>
            `);
            // tab control content
            $('#tab-content').append(`
            <div class="tab-pane fade" role="tabpanel" id="tab-${period}">
                <input id="${period}-searchbar" oninput="rerenderDuringTabSearch('${period}', event.target.value)" type="search" class="form-control-lg" style="width: 100%;color: rgb(45,46,55);border: 1px solid rgb(67,67,67);text-align: center; height: 5vh;" placeholder="Search Names" />
                <div class="btn-group btn-group-toggle d-flex" data-toggle="buttons" style="height: 5vh">
                    <label class="btn btn-outline-primary active" for="btnradio1-${period}" style="border-radius: 0;" onclick=sortAlphaTab('${period}')>
                        <input type="radio" name="btnradio-${period}" checked id="btnradio1-${period}">
                        A -> Z
                    </label>
                    <label class="btn btn-outline-primary" for="btnradio2-${period}" style="border-radius: 0;" onclick=sortDescendTab('${period}')>
                        <input type="radio" class="btn-check" name="btnradio-${period}" id="btnradio2-${period}">
                        +4, ..., -5
                    </label>
                    <label class="btn btn-outline-primary" for="btnradio3-${period}" style="border-radius: 0;" onclick=sortAscendTab('${period}')>
                        <input type="radio" name="btnradio-${period}" id="btnradio3-${period}">
                        1, 2, ...
                    </label>
                </div>
                <ul class="list-group text-monospace border rounded-0" id="list-group-${period}" style="height: 60vh;overflow-y: auto;">
                    
                </ul>
            </div>
            `)
        }
        // table rows
        for (const value of array) {
            $('#list-group-' + period).append(`
                <li id="${value.first}-${value.last}-${period}-row"class="list-group-item d-flex">
                    <span class="flex-grow-1" style="text-align: center;">${value.first} ${value.last}</span>
                    <span id="${value.first}-${value.last}-${period}-change" style="text-align: center; width: 75px; color: grey;">+0</span>
                    <input id="${value.first}-${value.last}-${period}-input" type="number" value="${value.points}" placeholder="0" min="0" step="1" style="text-align: center;width: 75px;" onchange="updateScore(event)">
                </li>
            `)
        }
    }
}

function writeModal() {
    var extra_container = [];
    for (var [period, array] of container) {
        for (var index in array) {
            var temp = new Object(null);
            temp.period = period;
            temp.first = array[index].first;
            temp.last = array[index].last;
            temp.points = array[index].points;
            extra_container.push(temp);
        }
    }
    document.getElementById('csv-out').innerText = "\n" + $.csv.fromObjects(extra_container);
}

function downloadModal() {
    var text = document.getElementById('csv-out').innerText.replace(/^\n/, "");
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', "points.csv");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

document.getElementById('copy-button').addEventListener('click', (e) => {
    navigator.clipboard.writeText(document.getElementById('csv-out').innerText.replace(/^\n/, ""));
    e.target.innerText = 'Copied';
    setTimeout(() => { document.getElementById('copy-button').innerText = 'Copy'; }, 3000);
});
document.getElementById('file-input-clickable').addEventListener('change', readFile, false);
document.getElementById('file-input').addEventListener('click', () => { document.getElementById('file-input-clickable').click() });
document.getElementById('text-input').addEventListener('click', () => { readText() });
document.getElementById('cache-input').addEventListener('click', () => { openDBandRead() });
document.getElementById('open-export-modal').addEventListener('click', () => { writeModal() })
document.getElementById('download-csv').addEventListener('click', () => { downloadModal() })
    // &#39;