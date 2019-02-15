const rp = require ('request-promise');
const $ = require('cheerio');
const fs  = require('fs');
const baseUrl = 'https://www.bankmega.com/promolainnya.php';

const parse = (url, imgtitle, img) => {
    return rp(url)
        .then((html) => {
            let range = $('.periode > b', html).text().split(' - ');
            return {
                title: imgtitle,
                imageurl: img,
                area: $('.area > b', html).text(),
                startdate: range[0],
                enddate: range[1]
            };
        })
        .catch((err) => {
            console.log(err)
        });
};

let totalPage = 0;
let promoUrls = {};
let outPromises = [];

const run = (baseUrl) => {
    for(let i = 1; i<=6; i++){
        let url = baseUrl + '?subcat=' + i;
        let outPromise = rp(url)
            .then(async (html) => {
                try {
                    totalPage = $('.page_promo_lain', html)[1].attribs.title.split("of ")[1];
                    let arr=[];
                    let promises = [];
                    for (let j = 1; j <= totalPage; j++){
                        const promise = rp(url + '&page=' + j)
                            .then((html) => {
                                for (let k = 0; k < $('#promolain > li > a', html).length; k++){
                                    let imgtitle = ($('#promolain > li > a > img', html)[k].attribs.title);
                                    let img = 'https://www.bankmega.com/' +  $('#promolain > li > a > img', html)[k].attribs.src;
                                    arr.push(parse('https://www.bankmega.com/' + $('#promolain > li > a', html)[k].attribs.href, imgtitle, img)); 
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                            });
                        promises.push(promise);
                        
                    }
                    await Promise.all(promises);
                    return Promise.all(arr); 
                }catch(err){
                    //total page = 0
                    return ([]);
                }
            })
            .then((promos) => {
                switch (i){
                    case 1 : promoUrls["travel and entertainment"] = promos;
                    case 2 : promoUrls["lifestyle and wellness"] = promos;
                    case 3 : promoUrls["f and b"] = promos;
                    case 4 : promoUrls["gadget and electronics"] = promos;
                    case 5 : promoUrls["daily needs and home appliances"] = promos;
                    case 6 : promoUrls["other info"] = promos;
                }
            })
            .catch((err) => {
                console.log(err);
            });
        outPromises.push(outPromise);
    }
    return Promise.all(outPromises);
}

run(baseUrl).then(() => {
    fs.writeFile('solution.json', JSON.stringify(promoUrls),'utf8', ()=>{})
});
