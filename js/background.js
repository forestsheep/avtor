function v1stListPage() {
    $.ajax({
        url: "http://thzu.cc/forum-220-1.html",
        method: "get",
        async: true,
        success: function (data, textStatus, jqXHR) {
            analyzeList(data, true)
        },
        error: function (jqXHR, textStatus, errorThrown) {}
    })
}

function vRemainListPage() {
    for (let i = 2; i <= totalPageAmount; i++) {
        setTimeout(() => {
            $.ajax({
                url: "http://thzbt.co/forum-220-" + i + ".html",
                method: "get",
                async: true,
                success: function (data, textStatus, jqXHR) {
                    analyzeList(data, false)
                },
                error: function (jqXHR, textStatus, errorThrown) {}
            })
        }, 10000 * i)
    }
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
            totalPageAmount = parseInt(rtPages[0]) - 470
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
    console.log("new loop")
    let trans = idb.transaction(["awesome"], "readwrite")
    // console.log(trans)
    let objectStore = trans.objectStore("awesome")
    // console.log(objectStore)
    for (let i = threadIdInt; i > threadIdInt - 1500; i--) {
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
                            thz_detail_url: dtlurl,
                            dmmhypsn: null
                        })
                        obsq.onsuccess = function (event) {
                            // console.log(event.target)
                        }
                        obsq.onerror = function (event) {
                            console.log("add error" + obsq.error)
                        }
                    }
                }
                $.ajax({
                    url: "http://thzbt.co/" + dtlurl,
                    method: "get",
                    async: true,
                    success: function (data, textStatus, jqXHR) {
                        analyzeTorretLink(data, vvsn)
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
        url: "http://thzbt.co/" + rt.attr("href"),
        method: "get",
        async: true,
        success: function (data, textStatus, jqXHR) {
            analyzeDlLink(data, rt.text(), avsn)
        },
        error: function (jqXHR, textStatus, errorThrown) {}
    })
}

function analyzeDlLink(htmlResponse, filename, avsn) {
    let ptn = new RegExp(/http:\/\/thzbt.co\/forum.php\?mod=attachment&aid=\w+/g)
    let rtn
    if ((rtn = ptn.exec(htmlResponse)) != null) {
        // dlTorrent(rtn[0], filename)
        let torrentUrl = rtn[0]
        setTimeout(() => {
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
        }, 10000)
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

function openDB() {
    let dbopenrequest = window.indexedDB.open("avdb", 1)

    dbopenrequest.onerror = function (event) {
        console.log("Database error: " + event.target.errorCode)
    }

    dbopenrequest.onsuccess = function (event) {
        console.log("Database open success")
        idb = dbopenrequest.result
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
            objectStore.createIndex("dmmsn", "dmmsn", {
                unique: false
            })
        }
    }
}

function generateDmmSn() {
    let trans = idb.transaction(["awesome"], "readwrite")
    let objectStore = trans.objectStore("awesome")
    objectStore.openCursor().onsuccess = function (event) {
        let cursor = event.target.result
        if (cursor) {
            let sn = cursor.value.sn
            let dsn = sn.replace("-", "00")
            cursor.value.dmmsn = dsn
            cursor.update(cursor.value)
            cursor.continue()
        }
    }
}

function delDuplication() {
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
                console.log("not same: " + inner_cursor.value.sn)
                prvobj = inner_cursor.value.sn
            }
            i++
            inner_cursor.continue()
        }
    }
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

function vdmm(dmmsn) {
    $.ajax({
        url: "http://www.dmm.co.jp/digital/videoa/-/detail/=/cid=" + dmmsn + "/",
        method: "get",
        async: true,
        success: function (data, textStatus, jqXHR) {
            analyzedmm(data, dmmsn)
        },
        error: function (jqXHR, textStatus, errorThrown) {}
    })
}

function analyzedmm(htmlResponse, dmmsn) {
    let doc = $(htmlResponse)
    // let cst = "#mu > div > table > tbody > tr > td:nth-child(1) > table.mg-b20 > tbody > tr:nth-child(3) > td.nw"

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
    let rtEvaluate = doc.find(csEvaluate)
    console.log(rtStartSend.text().trim())
    console.log(rtStartSell.text().trim())
    console.log(rtVedioLength.text().trim())
    // console.log(rtAvActors.text().trim())
    console.log(rtAvActors.text().trim().split("\n"))
    console.log(rtDirector.text().trim())
    console.log(rtSeries.text().trim())
    console.log(rtMaker.text().trim())
    console.log(rtLebel.text().trim())
    // console.log(rtGenre.text().trim())
    console.log(rtGenre.text().trim().split("  "))
    console.log(rtSn.text().trim())

    let t1 = idb.transaction(["awesome"], "readwrite")
    let o1 = t1.objectStore("awesome")
    o1.openCursor().onsuccess = function (event) {
        let cursor = event.target.result
        if (cursor) {
            let lcdmmsn = cursor.value.dmmsn
            if (dmmsn == lcdmmsn) {
                cursor.value.dmmhypsn = rtSn.text().trim()
                cursor.update(cursor.value)
            }
            cursor.continue()
        }
    }
}

//main run
let totalPageAmount
let idb
openDB()
setTimeout(() => {
    // v1stListPage()
    // generateDmmSn()
}, 3888)
setTimeout(() => {
    // findSn('mide-593')
    // delDuplication()
    // generateDmmSn()
    // vRemainListPage()
}, 8888)

setTimeout(() => {
    vdmm()
    let t1 = idb.transaction(["awesome"], "readwrite")
    let o1 = t1.objectStore("awesome")
    o1.openCursor().onsuccess = function (event) {
        let cursor = event.target.result
        if (cursor) {
            vdmm(cursor.value.dmmsn)
            cursor.continue()
        }
    }
}, 3888)