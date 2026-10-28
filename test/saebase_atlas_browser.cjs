"use strict";

const assert = require("node:assert/strict");
const {chromium} = require("@playwright/test");

const origin = process.env.ATLAS_TEST_ORIGIN || "http://127.0.0.1:8765";
const base = origin + "/opensae/saebase/atlas/";
const views = ["core", "knowledge", "code", "environment", "context"];
const CJK = /[\u3400-\u9fff]/;

async function run() {
  const browser = await chromium.launch({headless:true, args:["--no-sandbox"]});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:900}});
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));
    for(const view of views) {
      errors.length=0;
      await page.goto(base + view + ".html?lang=en", {
        waitUntil:"networkidle",timeout:90000
      });
      await page.waitForFunction(
        () => !!window.OPENRESEARCH_ATLAS &&
          typeof window.SAEBASE_ATLAS_SET_LANGUAGE === "function" &&
          !!window.SAEBASE_ATLAS_LOCALES?.nodes?.context,
        {timeout:60000}
      );
      const snapshot = await page.evaluate(viewName => {
        const graph=window.OPENRESEARCH_ATLAS;
        const en=window.SAEBASE_ATLAS_LOCALES;
        const data=graph[viewName]?.nodes||[];
        return {
          project:graph.context.project,
          rootName:document.querySelector(".brand")?.textContent||"",
          docLang:document.documentElement.lang,
          source:window.location.pathname,
          ids:data.map(n=>n.id),
          translated:Object.keys(en.nodes[viewName]||{}).length,
          examples:data.slice(0,8).map(n=>n.title),
          term:graph.context.nodes.find(n=>n.id==="term.sae.capture")?.title,
        };
      },view);
      assert.match(snapshot.project,/^SAEBase/,view+" loaded foreign graph");
      assert(snapshot.rootName.includes("SAEBase"),view+" has wrong header");
      assert.equal(snapshot.docLang,"en");
      assert(snapshot.ids.length>0 && snapshot.ids.length===snapshot.translated,
        view+" has incomplete English coverage");
      assert(!snapshot.examples.some(x=>CJK.test(x)||x.includes("�")),
        view+" displayed invalid English title");
      assert(!CJK.test(snapshot.term),view+" did not localize the Context term");

      await page.locator('#atlasLanguageSwitch button[data-lang="zh"]').click();
      await page.waitForFunction(() => document.documentElement.lang==="zh-CN");
      const chinese=await page.evaluate(() => ({
        term:window.OPENRESEARCH_ATLAS.context.nodes.find(n=>n.id==="term.sae.capture")?.title,
        ids:window.OPENRESEARCH_ATLAS[document.body.dataset.atlasView]?.nodes.map(n=>n.id)
      }));
      assert(CJK.test(chinese.term),view+" Chinese Context was not restored");
      assert.deepEqual(chinese.ids,snapshot.ids,view+" changed node identity when switching");
      await page.locator('#atlasLanguageSwitch button[data-lang="en"]').click();
      await page.waitForFunction(() => document.documentElement.lang==="en");
      const again=await page.evaluate(() =>
        window.OPENRESEARCH_ATLAS.context.nodes.find(n=>n.id==="term.sae.capture")?.title
      );
      assert.equal(again,snapshot.term,view+" cannot round-trip English terminology");
      assert.equal(errors.length,0,view+" browser errors: "+errors.join(" | "));
      console.log(view+": English/Chinese identity, UI and source scope verified");
    }
    errors.length=0;
    await page.goto(origin+"/opensae/openresearch/atlas/context.html?lang=en",{
      waitUntil:"networkidle",timeout:90000
    });
    const other=await page.evaluate(()=>({
      brand:document.querySelector(".brand")?.textContent||"",
      link:document.querySelector(".brand")?.getAttribute("href")||"",
      own:!!window.SAEBASE_ATLAS_LOCALES,
      hasOtherProjectTopics:window.OPENRESEARCH_ATLAS.knowledge.nodes.some(n=>/cub/i.test(n.id))
    }));
    assert(other.brand.includes("OpenResearch"),"OpenResearch project title was replaced");
    assert(other.link.includes("OpenResearch"),"OpenResearch links point to SAEBase");
    assert(!other.own,"SAEBase English data leaked into OpenResearch");
    assert(other.hasOtherProjectTopics,"OpenResearch's distinct Knowledge graph is missing");
    assert.equal(errors.length,0,"OpenResearch browser errors: "+errors.join(" | "));
    console.log("Both Atlas projects remain independently usable in the browser");
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode=1;
});
