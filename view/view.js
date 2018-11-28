this.st = function () {
    var vm = new Vue({
        el: '#avsearch',
        data: {
            click: "a1",
            sns: ["not found"],
            in_genres: "",
            genres_list: null,
            img_url: "",
            img_url1: "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-652391.jpg",
            img_url2: "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-652395.jpg",
            is_show_img: false
        },
        ready: function () {},
        methods: {
            v1: function () {
                let splitedArray = this.in_genres.split(" ")
                // let idb
                let pro1 = new Promise(openDB)
                function giveWantSearches() {
                    return new Promise((resolve, reject) => {
                        resolve(splitedArray)
                    })
                }
                let v
                let pro2 = pro1.then(giveWantSearches).then(searchGenres).then(compareGenreSn).then(function (value) {
                    // console.log(value)
                    v = value
                })
                setTimeout(() => {
                    if (v.length == 0) {
                        this.sns = ["not found"]
                    } else {
                        this.sns = v
                    }
                }, 2000)
            },
            v2: function () {
                let abc
                let pro1 = new Promise(openDB)
                let pro2 = pro1.then(getUniGenre).then(function (value) {
                    abc = value
                })
                setTimeout(() => {
                    this.genres_list = abc
                }, 2000)
            },
            getIndex: function(index) {
                console.log(this.in_genres)
                if (this.in_genres != "") {
                    this.in_genres += " "
                }
                this.in_genres += this.genres_list[index]
            },
            clearText: function() {
                this.in_genres = ""
            },
            showImg: function() {
                if (!this.is_show_img) {
                    this.is_show_img = true
                    if (this.img_url == this.img_url1) {
                        this.img_url = this.img_url2
                    } else {
                        this.img_url = this.img_url1
                    }
                } else {
                    this.is_show_img = false
                }

            }
        }
    })
}
window.onload = st