// "use strict"
function openDB(resolve, reject) {
    let dbopenrequest = window.indexedDB.open("avdb", 2)

    dbopenrequest.onerror = function (event) {
        console.log("Database error: " + event.target.errorCode)
    }

    dbopenrequest.onsuccess = function (event) {
        console.log("Database open success")
        idb = dbopenrequest.result
        resolve()
    }

    dbopenrequest.onupgradeneeded = function (event) {
        // console.log("upg")
        let db = event.target.result
        db.onerror = function (errorEvent) {
            console.log("Error loading database.")
        }
        if (event.oldVersion < 1) {
            let objectStore = db.createObjectStore("awesome", {
                autoIncrement: true
            })
            objectStore.createIndex("sn", "sn", {
                unique: false
            })
            objectStore.createIndex("dmm_hyp_sn", "dmm_hyp_sn", {
                unique: false
            })
        }
        if (event.oldVersion < 2) {
            let objectStore = db.createObjectStore("genre", {
                autoIncrement: true
            })
            objectStore.createIndex("genre", "genre", {
                unique: false
            })
        }
    }
}

function searchGenres(wantSearches) {
    return new Promise((resolve, reject) => {
        let resultArrays = new Array()
        wantSearches.push("")
        wantSearches.reduce(async (previousPromise, nextID) => {
            await previousPromise
            previousPromise.then(function (value) {
                // console.log(value)
                resultArrays.push(value)
            })
            // return searchActor(nextID)
            return loopSearchGenre(nextID)
        }, Promise.resolve("init"))
        setTimeout(() => {
            resultArrays.reverse().pop()
            resolve(resultArrays)
        }, wantSearches.length * 333)
    })
}

function loopSearchGenre(genreString) {
    return new Promise((resolve, reject) => {
        let t = idb.transaction(["genre"], "readwrite")
        let osGen = t.objectStore("genre")
        let ind = osGen.index("genre")
        let getRequest = ind.getAll(genreString)
        getRequest.onsuccess = function () {
            resolve(getRequest.result)
        }
    })
}

function compareGenreSn(arrays) {
    return new Promise((resolve, reject) => {
        let comparedOutputArray = new Array()
        for (i in arrays) {
            if (i > 0) {
                let comparedArray = new Array()
                for (j in comparedOutputArray) {
                    for (k in arrays[i]) {
                        if (comparedOutputArray[j].sn == arrays[i][k].sn) {
                            comparedArray.push(comparedOutputArray[j])
                        }
                    }
                }
                comparedOutputArray = comparedArray
                continue
            }
            comparedOutputArray = arrays[i]
        }
        let resultArray = new Array()
        for (i in comparedOutputArray) {
            resultArray.push(comparedOutputArray[i].sn)
        }
        // console.log(resultArray)
        resolve(resultArray)
    })
}

function getUniGenre() {
    return new Promise((resolve, reject) => {
        let t = idb.transaction(["genre"], "readwrite")
        let osGen = t.objectStore("genre")
        let ind = osGen.index("genre")
        let cp = null
        let rtnArray = new Array()
        ind.openCursor().onsuccess = function (event) {
            let cursor = event.target.result
            if (cursor) {
                let mkey = cursor.key
                if (mkey != cp) {
                    rtnArray.push(mkey)
                    cp = mkey
                } else {}
                cursor.continue()
            }
        }
        setTimeout(() => {
            resolve(rtnArray)
        }, 1000);
    })
}