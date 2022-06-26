const cheerio = require("cheerio");
const axios = require("axios");
const puppeteer = require("puppeteer");
const fs = require("fs");

var abbreviations = [
  { name: "Xbox", abb: "XB" },
  { name: "Logitech", abb: "LT" },
  { name: "HeimVision", abb: "HV" },
  { name: "Lorex", abb: "LX" },
  { name: "Jetson", abb: "JS" },
  { name: "HP", abb: "HP" },
  { name: "Samsung", abb: "SM" },
  { name: "Kangaroo", abb: "KG" },
  { name: "Apple", abb: "AP" },
  { name: "World of Farming", abb: "WOF" },
  { name: "CI", abb: "CI" },
  { name: "Beats", abb: "AP" },
  { name: "Powerbeats", abb: "AP" },
  { name: "GOPRO", abb: "GO" },
  { name: "Nintendo Switch", abb: "NS" },
  { name: "Nintendo", abb: "NT" },
  { name: "Beats", abb: "AP" },
  { name: "Ring", abb: "RG" },
  { name: "ARRIS", abb: "AR" },
  { name: "Protocol", abb: "PD" },
  { name: "VANKYO", abb: "VK" },
  { name: "TP-Link", abb: "TP" },
  { name: "NETGEAR", abb: "NG" },
  { name: "Bose", abb: "BS" },
  { name: "Arlo", abb: "AL" },
  { name: "Night Owl", abb: "NO" },
  { name: "AtGames", abb: "AT" },
  { name: "Dichroic", abb: "DC" },
  { name: "ZTE", abb: "ZTE" },
  { name: "LG", abb: "LG" },
  { name: "D-LINK", abb: "DL" },
  { name: "WyzeCam", abb: "WZ" },
  { name: "Arcade1UP", abb: "A1UP" },
  { name: "WyzeCam", abb: "WZ" },
  { name: "Lenovo", abb: "LV" },
  { name: "Acer", abb: "AC" },
];

function createSKU(title, modalNum, cond) {
  var abbr = "";
  var skuString;
  console.log(title);
  for (var i = 0; i != abbreviations.length; i++) {
    var abb = abbreviations[i];
    var abbrName = abb.name;
    if (title.search(abbrName) !== -1) {
      abbr = abb.abb;
      break;
    } else {
      abbr = "CNR";
    }
  }

  skuString = abbr + "-" + modalNum + "-" + cond;
  return skuString;
}

async function getInfo(siteHTML, UPC_Code, prodWeight) {
  try {
    const productObj = {};
    let features = [];
    let images = [];

    const $ = cheerio.load(siteHTML);

    const titleSelector = 'div[class="sku-title"]';
    const productTitle = $(titleSelector).children("h1").text();

    let localSKU = "";

    if (productTitle) {
      localSKU = createSKU(productTitle, "A00002", "GARB1");
      console.log("LOCALSKU", localSKU);
    }

    const skuDescriptor = 'div[class="sku product-data"]';
    const skuNumber = $(skuDescriptor).find(
      'span[class="product-data-value body-copy"]'
    );

    const productDescription =
      'div[class="long-description-container body-copy "]';

    const featuresList = 'div[class="features-list all-features"]';
    const imgList = 'ul[class="thumbnail-list"]';

    $(imgList).each((parentIdx, parentElm) => {
      $(parentElm)
        .children()
        .each((childIdx, childElm) => {
          if (childElm.name == "li") {
            images.push(
              $(childElm).find("div").find("button").find("img").attr("src")
            );
          }
        });
    });

    $(featuresList).each((parentIdx, parentElm) => {
      $(parentElm)
        .children()
        .each((childIdx, childElm) => {
          if ($(childElm).find("div > p")) {
            features.push($(childElm).find("div > p").text());
          }
        });
    });

    images = images.filter(function (element) {
      return element !== undefined;
    });

    var descriptionHTML =
      "<div> <h3> <strong>Description: </strong></h3><p>" +
      $(productDescription).text() +
      "</p><h3> <strong>Features: </strong> </h3> <p>" +
      features +
      "</p></div>";
    productObj.TXW_SKU = localSKU;
    productObj.title = productTitle;
    productObj.skuNumber = $(skuNumber).text();
    productObj.UPC = UPC_Code;
    productObj.productDescription = descriptionHTML;
    productObj.images = images;
    productObj.features = features;
    productObj.weight = prodWeight;
    console.log("\nProduct: ", productObj);
  } catch (error) {
    console.log(error);
  }
}

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto(
      "https://www.bestbuy.com/site/wyze-cam-v3-1080p-hd-indoor-outdoor-video-security-camera-with-color-night-vision-and-2-way-audio-white/6474737.p?skuId=6474737"
    );
    await page.setViewport({
      width: 1200,
      height: 800,
    });

    await page.click("div.shop-specifications");
    await page.waitForSelector(".spec-categories");

    // await page.screenshot({ path: "img.png" });
    const pageData = await page.evaluate(() => {
      return { html: document.documentElement.innerHTML };
    });

    const UPC_HTML = await page.evaluate(
      () => document.querySelector(".spec-categories").innerHTML
    );

    const $ = cheerio.load(UPC_HTML);
    const wrapper = 'div[class="category-wrapper"]';
    var UPCcode = "";
    var weight = "";
    $(wrapper).each((id, element) => {
      var elem = $(element)
        .find('div > div > ul > li > div > div[class="row-title"]')
        .text();

      var elemlbs = $(element)
        .find('div > div > ul > li > div > div > div[class="row-title"]')
        .text();

      if (elem.search("UPC") !== -1) {
        UPCcode = $(element)
          .find(
            'div > div > ul > li > div[class="row-value v-fw-regular col-xs-6"]'
          )
          .text();
      }

      if (elemlbs.search("Product Weight") !== -1) {
        console.log("foundit");
        weight = $(element)
          .find(
            'div > div > ul > li > div[class="row-value v-fw-regular col-xs-6"]'
          )
          .text();
      }
    });

    console.log(UPCcode);

    await browser.close();

    getInfo(pageData.html, UPCcode, weight);
  } catch (error) {
    console.log(error);
  }
})();
