this.st = function () {
    var vm = new Vue({
        el: '#avsearch',
        data: {
            click: "a1",
            searchResults: ["not found"],
            in_genres: [],
            in_actors: [],
            is_show_genre: true,
            is_show_actor: true,
            genre_list: [],
            actor_list: [],
            info_list: [],
            img_url: "",
            // img_url1: "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-652391.jpg",
            // img_url2: "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-652395.jpg",
            is_show_img: false
        },
        mounted: function () {
            let passValueGenre = null
            let passValueActor = null
            let pro1 = new Promise(openDB)
            pro1.then(getUniGenre).then(function (value) {
                passValueGenre = value
            })
            pro1.then(getUniActor).then(function(value){
                passValueActor = value
            })
            setTimeout(() => {
                this.genre_list = passValueGenre
                this.actor_list = passValueActor
            }, 2000)
            //getUniActor
        },
        methods: {
            startSearch: function () {
                let in_genres_copy = this.in_genres.slice()
                let pro1 = new Promise(openDB)
                function giveWantSearches1() {
                    return new Promise((resolve, reject) => {
                        resolve(in_genres_copy)
                    })
                }
                let passValue1 = new Array()
                pro1.then(giveWantSearches1).then(searchGenres).then(compareGenreSn).then(function (value) {
                    passValue1 = value
                })
                let in_actors_copy = this.in_actors.slice()
                let pro2 = new Promise(openDB)

                function giveWantSearches2() {
                    return new Promise((resolve, reject) => {
                        resolve(in_actors_copy)
                    })
                }
                let passValue2 = new Array()
                pro2.then(giveWantSearches2).then(searchActors).then(compareGenreSn).then(function (value) {
                    passValue2 = value
                })
                setTimeout(() => {
                    let intersection = passValue1.filter(v => passValue2.includes(v))
                    if (passValue1.length == 0) {
                        intersection = passValue2
                    }
                    if (passValue2.length == 0) {
                        intersection = passValue1
                    }
                    if (intersection.length == 0) {
                        this.searchResults = ["not found"]
                    } else {
                        this.searchResults = intersection
                        console.log(intersection)
                    }
                }, 2000)
            },
            getGenreIndex: function (index) {
                this.in_genres.push(this.genre_list[index])
            },
            getActorIndex: function (index) {
                this.in_actors.push(this.actor_list[index])
            },
            clearText: function () {
                this.in_actors = []
                this.in_genres = []
            },
            popActor(index) {
                this.in_actors.splice(index, 1)

            },
            popGenre(index) {
                this.in_genres.splice(index, 1)
            },
            showImg: function (sn) {
                this.is_show_img = true
                function giveSn() {
                    return new Promise((resolve, reject) => {
                        resolve(sn)
                    })
                }
                let tempv = ""
                let tempi = ""
                let pro1 = new Promise(openDB)
                let pro2 = pro1.then(giveSn).then(getInfoBySn).then(function (value) {
                    tempv = "http://pics.dmm.co.jp/digital/video/" + value.dmm_hyp_sn + "/" + value.dmm_hyp_sn + "pl.jpg"
                    tempi = []
                    tempi.push("标题：" + value.title)
                    tempi.push("送信开始：" + value.start_send)
                    tempi.push("贩卖开始：" + value.start_sell)
                    tempi.push("长度：" + value.vedio_length)
                    tempi.push("演员：" + value.actors)
                    tempi.push("导演：" + value.director)
                    tempi.push("片商：" + value.maker)
                    tempi.push("标签：" + value.lebel)
                    tempi.push("体裁/流派：" + value.genre)
                })
                setTimeout(() => {
                    this.img_url = tempv
                    this.info_list = tempi
                }, 100)
            },
            expandActors: function() {
                if (this.is_show_actor) {
                    this.is_show_actor = false
                } else {
                    this.is_show_actor = true
                }
            },
            expandGenres: function() {
                if (this.is_show_genre) {
                    this.is_show_genre = false
                } else {
                    this.is_show_genre = true
                }
            }
        }
    })
}
window.onload = st