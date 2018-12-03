let domain = "http://thzthz.cc/"
function v1stListPage() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: domain + "forum-220-1.html",
            method: "get",
            async: true,
            success: function (data, textStatus, jqXHR) {
                console.log("analzying first page")
                analyzeList(data, true)
                setTimeout(() => {
                    resolve()
                }, 30000);
            },
            error: function (jqXHR, textStatus, errorThrown) {}
        })
    })
}

function vRemainListPage(resolve, reject) {
    return new Promise((resolve, reject) => {
        for (let i = 2; i <= totalPageAmount; i++) {
            setTimeout(() => {
                console.log("doing page " + i)
                $.ajax({
                    url: domain + "forum-220-" + i + ".html",
                    method: "get",
                    async: true,
                    success: function (data, textStatus, jqXHR) {
                        console.log("analyzing remain page")
                        analyzeList(data, false)
                    },
                    error: function (jqXHR, textStatus, errorThrown) {}
                })
            }, 30000 * i)
        }
        setTimeout(() => {
            console.log("remain page shoud be all done")
            resolve()
        }, 30000 * totalPageAmount + 30000);
    })
}

function analyzeList(htmlResponse, isFirstPage) {
    let doc = $(htmlResponse)
    let cslinenext
    if (isFirstPage) {
        cslinenext = "#threadlisttableid > script + tbody"
        csPages = "#fd_page_top > div > a.last"
        let dPages = doc.find(csPages)
        // console.log(dPages.length)
        // console.log(dPages.text())
        let rtPages
        if (rtPages = new RegExp(/\d+/g).exec(dPages.text())) {
            totalPageAmount = parseInt(rtPages[0]) - 278
        }
    } else {
        cslinenext = "#threadlisttableid > tbody:nth-child(2)"
    }
    let dlinenext = doc.find(cslinenext)
    // console.log(dlinenext.text())
    let csn = dlinenext.attr("id")
    let numPtn = new RegExp(/\d+/g)
    let threadIdInt
    let threadIdString
    if ((threadIdString = numPtn.exec(csn)) != null) {
        threadIdInt = parseInt(threadIdString[0])
    }
    let csIdFormat = "#normalthread_{0} > tr > th > a.s.xst"
    let trans = idb.transaction(["awesome"], "readwrite")
    // console.log(trans)
    let objectStore = trans.objectStore("awesome")
    console.log("is 1st page? " + isFirstPage)
    // console.log(objectStore)
    for (let i = threadIdInt; i > threadIdInt - 2500; i--) {
        let cstextf = stringFormat(csIdFormat, i)
        let rt = doc.find(cstextf)
        if (rt.length != 0) {
            let dtlurl = rt.attr("href")
            let rtSn
            if (rtSn = new RegExp(/\w+-\d+/g).exec(rt.text())) {
                // console.log(rtSn[0])
                let vvsn = rtSn[0]
                let ind = objectStore.index("sn")
                let getq = ind.get(vvsn)
                getq.onsuccess = function () {
                    // console.log(getq.result)
                    if (getq.result) {} else {
                        let obsq = objectStore.add({
                            sn: vvsn,
                            thz_detail_url: dtlurl
                            // dmmhypsn: null
                        })
                        obsq.onsuccess = function (event) {
                            // console.log(event.target)
                        }
                        obsq.onerror = function (event) {
                            console.log("add error" + obsq.error)
                        }
                        obsq.oncomplete = function () {
                            console.log("add sn, detail url completed")
                        }
                    }
                }
                $.ajax({
                    url: domain + dtlurl,
                    method: "get",
                    async: true,
                    success: function (data, textStatus, jqXHR) {
                        analyzeTorretLink(data, vvsn)
                        // console.log("analyzing Torrent Link")
                    },
                    error: function (jqXHR, textStatus, errorThrown) {}
                })
            }
        } else {
            // console.log("not found title")
        }
    }
}

function analyzeTorretLink(htmlResponse, avsn) {
    // console.log(htmlResponse)
    let doc = $(htmlResponse)
    let cstext = "#postlist > div:nth-child(3) > table tbody > tr:nth-child(1) > td.plc > div.pct > div > div.t_fsz > div.pattl > ignore_js_op > dl > dd > p.attnm > a"
    let rt = doc.find(cstext)
    // console.log(rt.length)
    // console.log(rt.text())
    // console.log(rt.attr("href"))
    $.ajax({
        url: domain + rt.attr("href"),
        method: "get",
        async: true,
        success: function (data, textStatus, jqXHR) {
            analyzeDlLink(data, rt.text(), avsn)
            // console.log("analyzing DL link")
        },
        error: function (jqXHR, textStatus, errorThrown) {}
    })
}

function analyzeDlLink(htmlResponse, filename, avsn) {
    let ptn = new RegExp(domain + "forum.php\\?mod=attachment&aid=\\w+", "g")
    // let ptn = new RegExp(/http:\/\/thzthz.cc\/forum.php\?mod=attachment&aid=\w+/g)
    let rtn
    if ((rtn = ptn.exec(htmlResponse)) != null) {
        // dlTorrent(rtn[0], filename)
        let torrentUrl = rtn[0]
        // setTimeout(() => {
        let trans = idb.transaction(["awesome"], "readwrite")
        let objectStore = trans.objectStore("awesome")
        objectStore.openCursor().onsuccess = function (event) {
            let cursor = event.target.result
            if (cursor) {
                let sn = cursor.value.sn
                if (sn == avsn) {
                    cursor.value.torrent_link = torrentUrl
                    cursor.update(cursor.value)
                }
                cursor.continue()
            }
        }
        console.log("analyzing dl link over")
        // }, 1000)
    }
}

function dlTorrent(url, targetFilename) {
    fetch(url).then(res => res.blob().then(blob => {
        var a = document.createElement('a')
        var url = window.URL.createObjectURL(blob)
        var filename = targetFilename
        a.href = url
        a.download = filename
        a.click()
        window.URL.revokeObjectURL(url)
    }))
}

function openDB(resolve, reject) {
    let dbopenrequest = window.indexedDB.open("avdb", 3)

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
        if (event.oldVersion < 3) {
            let objectStore = db.createObjectStore("actor", {
                autoIncrement: true
            })
            objectStore.createIndex("actor", "actor", {
                unique: false
            })
        }
    }
}

// 生成dmm的猜想sn
function generateDmmGuessSn() {
    return new Promise((resolve, reject) => {
        console.log("start generateDmmGuessSn")
        let trans = idb.transaction(["awesome"], "readwrite")
        let objectStore = trans.objectStore("awesome")
        objectStore.openCursor().onsuccess = function (event) {
            let cursor = event.target.result
            if (cursor) {
                let sn = cursor.value.sn
                let dsn = sn.replace("-", "00")
                cursor.value.dmm_guess_sn = dsn
                cursor.update(cursor.value)
                cursor.continue()
            }
        }
        setTimeout(() => {
            console.log("generateDmmGuessSn over")
            resolve()
        }, 2000);
    })
}

function delDuplication() {
    return new Promise((resolve, reject) => {
        console.log("start delDuplication")
        let t1 = idb.transaction(["awesome"], "readwrite")
        let o1 = t1.objectStore("awesome")
        let qu = o1.index("sn")
        let i = 0
        let prvobj
        qu.openCursor().onsuccess = function (event) {
            let inner_cursor = event.target.result
            if (inner_cursor) {
                if (prvobj == inner_cursor.value.sn) {
                    console.log("find same: " + inner_cursor.value.sn)
                    let dqu = inner_cursor.delete()
                    dqu.onsuccess = function () {
                        console.log('Deleted success.')
                    }
                } else {
                    // console.log("not same: " + inner_cursor.value.sn)
                    prvobj = inner_cursor.value.sn
                }
                i++
                inner_cursor.continue()
            }
        }
        setTimeout(() => {
            console.log("delDuplication over")
            resolve()
        }, 2000);
    })
}

function findSn(findString) {
    let t1 = idb.transaction(["awesome"], "readwrite")
    let o1 = t1.objectStore("awesome")
    let myIndex = o1.index("sn")
    var getRequest = myIndex.get(findString)
    getRequest.onsuccess = function () {
        console.log(getRequest.result)
    }
}

// 直接用猜想sn访问dmm
function vDmmDetailByGuess(dmmGuessSn) {
    $.ajax({
        url: "http://www.dmm.co.jp/digital/videoa/-/detail/=/cid=" + dmmGuessSn + "/",
        method: "get",
        async: true,
        success: function (data, textStatus, jqXHR) {
            analyzeDmmDetail(data, dmmGuessSn)
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // 没找到会到这里来 404
            dmmSearch(dmmGuessSn)
        }
    })
}

// dmm搜索
function dmmSearch(searchStr) {
    $.ajax({
        url: "http://www.dmm.co.jp/search/=/searchstr=" + searchStr + "/analyze=V1EBAVcHUwE_/limit=30/n1=FgRCTw9VBA4GAVhfWkIHWw__/n2=Aw1fVhQKX1ZRAlhMUlo5QQgBU1lR/sort=ranking/",
        method: "get",
        async: true,
        success: function (data, textStatus, jqXHR) {
            analyzeDmmSearch(data, searchStr)
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // console.log(jqXHR.status)
        }
    })
}

// 分析dmm搜索结果
function analyzeDmmSearch(htmlResponse, searchStr) {
    let doc = $(htmlResponse)

    let csnotfind = "#main-src > div:nth-child(1) > div:nth-child(2) > div > div > p"
    let rtnotfind = doc.find(csnotfind)
    if (rtnotfind.length > 0) {
        return
    }
    console.log(searchStr)
    let csitem = "#list > li > div > p.tmb > a"
    let rtitem = doc.find(csitem)
    console.log("find av    " + searchStr + "    " + rtitem.length)
    // console.log(rtitem)
    // console.log(rtitem[0])
    let detailUrl = rtitem.attr("href")
    if (detailUrl != null) {
        $.ajax({
            url: detailUrl,
            method: "get",
            async: true,
            success: function (data, textStatus, jqXHR) {
                analyzeDmmDetail(data, searchStr)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // console.log(jqXHR.status)
            }
        })
    }
}

// 分析dmm详细页面，并写入db
function analyzeDmmDetail(htmlResponse, dmmHypSn) {
    let doc = $(htmlResponse)
    // タイトル
    let csTitle = "#title"
    // 配信開始日
    let csStartSend = "#mu > div > table > tbody > tr > td:nth-child(1) > table.mg-b20 > tbody > tr:nth-child(3) > td:nth-child(2)"
    // 商品発売日
    let csStartSell = "#mu > div > table > tbody > tr > td:nth-child(1) > table.mg-b20 > tbody > tr:nth-child(4) > td:nth-child(2)"
    // 収録時間
    let csVedioLength = "#mu > div > table > tbody > tr > td:nth-child(1) > table.mg-b20 > tbody > tr:nth-child(5) > td:nth-child(2)"
    // 出演者
    let csAvActors = "#mu > div > table > tbody > tr > td:nth-child(1) > table.mg-b20 > tbody > tr:nth-child(6) > td:nth-child(2)"
    // 監督
    let csDirector = "#mu > div > table > tbody > tr > td:nth-child(1) > table.mg-b20 > tbody > tr:nth-child(7) > td:nth-child(2) > a"
    // シリーズ
    let csSeries = "#mu > div > table > tbody > tr > td:nth-child(1) > table.mg-b20 > tbody > tr:nth-child(8) > td:nth-child(2) > a"
    // メーカー
    let csMaker = "#mu > div > table > tbody > tr > td:nth-child(1) > table.mg-b20 > tbody > tr:nth-child(9) > td:nth-child(2) > a"
    // レーベル
    let csLebel = "#mu > div > table > tbody > tr > td:nth-child(1) > table.mg-b20 > tbody > tr:nth-child(10) > td:nth-child(2) > a"
    // ジャンル
    let csGenre = "#mu > div > table > tbody > tr > td:nth-child(1) > table.mg-b20 > tbody > tr:nth-child(11) > td:nth-child(2)"
    // 品番
    let csSn = "#mu > div > table > tbody > tr > td:nth-child(1) > table.mg-b20 > tbody > tr:nth-child(12) > td:nth-child(2)"
    // 平均評価
    let csEvaluate = "#mu > div > table > tbody > tr > td:nth-child(1) > table.mg-b20 > tbody > tr:nth-child(11) > td:nth-child(2)"

    let rtTitle = doc.find(csTitle)
    if (rtTitle.length < 1) {
        return
    }
    let rtStartSend = doc.find(csStartSend)
    let rtStartSell = doc.find(csStartSell)
    let rtVedioLength = doc.find(csVedioLength)
    let rtAvActors = doc.find(csAvActors)
    let rtDirector = doc.find(csDirector)
    let rtSeries = doc.find(csSeries)
    let rtMaker = doc.find(csMaker)
    let rtLebel = doc.find(csLebel)
    let rtGenre = doc.find(csGenre)
    let rtSn = doc.find(csSn)

    let t1 = idb.transaction(["awesome"], "readwrite")
    let o1 = t1.objectStore("awesome")
    o1.openCursor().onsuccess = function (event) {
        let cursor = event.target.result
        if (cursor) {
            let lcdmmsn = cursor.value.dmm_guess_sn
            if (dmmHypSn == lcdmmsn) {
                let putDate = cursor.value
                putDate.title = rtTitle.text().trim()
                putDate.start_send = rtStartSend.text().trim()
                putDate.start_sell = rtStartSell.text().trim()
                putDate.vedio_length = rtVedioLength.text().trim()
                putDate.actors = rtAvActors.text().trim().split("\n")
                putDate.director = rtDirector.text().trim()
                putDate.series = rtSeries.text().trim()
                putDate.maker = rtMaker.text().trim()
                putDate.lebel = rtLebel.text().trim()
                putDate.genre = rtGenre.text().trim().split("  ")
                putDate.dmm_hyp_sn = rtSn.text().trim()
                putDate.info_source = "dmm"
                cursor.update(putDate)
            }
            cursor.continue()
        }
    }
}

function loopGetDmmInfo(maxCount) {
    maxCount = 6800
    for (let i = 0; i < maxCount / 100 + 1; i++) {
        setTimeout(() => {
            getDmmInfo (i)
        }, 30000 * i);
    }
}
// 遍历全体，去dmm查找
function getDmmInfo(c) {
    let t1 = idb.transaction(["awesome"], "readwrite")
    let o1 = t1.objectStore("awesome")
    o1.openCursor().onsuccess = function (event) {
        let cursor = event.target.result
        if (cursor) {
            if (!cursor.value.info_source) {
                if (cursor.key > c * 100 && cursor.key < 100 * (c + 1)) {
                    vDmmDetailByGuess(cursor.value.dmm_guess_sn)
                    // console.log(cursor.value.dmm_guess_sn)
                    // console.log(cursor.key)
                }
            }
            cursor.continue()
        }
    }
}

// 没有直接在dmm中找到，尝试搜索
function notFindInDmm() {
    let t1 = idb.transaction(["awesome"], "readwrite")
    let o1 = t1.objectStore("awesome")
    o1.openCursor().onsuccess = function (event) {
        let cursor = event.target.result
        if (cursor) {
            data = cursor.value
            if (data.info_source === undefined) {
                dmmSearch(data.dmm_guess_sn)
            }
            cursor.continue()
        }
    }
}

// 填充genre内容
function genGenre() {
    let t = idb.transaction(["awesome", "genre"], "readwrite")
    let osAwe = t.objectStore("awesome")
    let osGen = t.objectStore("genre")
    osAwe.openCursor().onsuccess = function (event) {
        let cursor = event.target.result
        if (cursor) {
            data = cursor.value
            if (data.genre !== undefined) {
                for (i in data.genre) {
                    osGen.add({
                        genre: data.genre[i],
                        sn: data.sn
                    })
                }
            }
            cursor.continue()
        }
    }
    setTimeout(() => {
        // resolve()
        console.log("gen genre over")
    }, 2000)
}

// 填充女优内容
function genActor() {
    let t = idb.transaction(["awesome", "actor"], "readwrite")
    let osAwe = t.objectStore("awesome")
    let osAct = t.objectStore("actor")
    osAwe.openCursor().onsuccess = function (event) {
        let cursor = event.target.result
        if (cursor) {
            data = cursor.value
            if (data.actors !== undefined) {
                for (i in data.actors) {
                    osAct.add({
                        actor: data.actors[i],
                        sn: data.sn
                    })
                }
            }
            cursor.continue()
        }
    }
    setTimeout(() => {
        // resolve()
        console.log("actor genre over")
    }, 2000)
}

function searchGenre(genreString) {
    // console.log(genreArray[j])
    let t = idb.transaction(["genre"], "readwrite")
    let osGen = t.objectStore("genre")
    let rtnArray = new Array()
    osGen.openCursor().onsuccess = function (event) {
        let cursor = event.target.result
        if (cursor) {
            data = cursor.value
            // console.log(data.genre)
            if (genreString == data.genre) {
                // console.log(data.sn)
                // console.log(data.genre)
                rtnArray.push(data.sn)
            }
            cursor.continue()
        }
    }
    return rtnArray
}

function searchActor(actorStr) {
    // console.log(genreArray[j])
    let t = idb.transaction(["awesome"], "readwrite")
    let awGen = t.objectStore("awesome")
    let snArray = new Array()
    awGen.openCursor().onsuccess = function (event) {
        let cursor = event.target.result
        if (cursor) {
            data = cursor.value
            for (i in data.actors) {
                if (data.actors[i] == actorStr) {
                    console.log(actorStr + ":" + data.dmm_hyp_sn)
                    snArray.push(data.dmm_hyp_sn)
                }
            }
            cursor.continue()
        }
    }
    return ("ajksd;flkjas")
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
                            // console.log("found!!!")
                            // console.log(comparedOutputArray[j])
                            // console.log(arrays[i][k])
                            comparedArray.push(comparedOutputArray[j])
                        }
                    }
                }
                // console.log("第" + i + "次比较结果为：")
                // console.log(comparedArray)
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


//main run
let totalPageAmount
let idb

let pro1 = new Promise(openDB)
// let pro2 = pro1.then(v1stListPage)
// let pro2 = pro1.then(v1stListPage).then(vRemainListPage).then(delDuplication).then(generateDmmGuessSn)
// let pro2 = pro1.then(delDuplication).then(generateDmmGuessSn)
// let pro2 = pro1.then(getDmmInfo)
// let pro2 = pro1.then(loopGetDmmInfo)
// let pro2 = pro1.then(genGenre)
// let pro2 = pro1.then(genActor)
// let pro2 = pro1.then(searchGenres())
// let pro2 = pro1.then(searchGenres).then(compareGenreSn).then(function(value){
//     console.log(value)
// })