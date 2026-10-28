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
          invalid:data.filter(n=>/:(?:nav|public-nav):/.test(n.id) ||
            /第\\d+组|按源码职责浏览相关操作|分组浏览相关接口/.test(n.title||""))
            .map(n=>n.id),
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
      assert.equal(snapshot.invalid.length,0,
        view+" contains fabricated navigation groups: "+snapshot.invalid.join(", "));
      assert(!snapshot.examples.some(x=>CJK.test(x)||x.includes("�")),
        view+" displayed invalid English title");
      assert(!CJK.test(snapshot.term),view+" did not localize the Context term");
      const visibleTitles = await page.locator(".graph-node .node-title").allTextContents();
      assert(visibleTitles.length > 0,view+" rendered no source-backed nodes");
      assert(!visibleTitles.some(text => CJK.test(text) || text.includes("�")),
        view+" contains untranslated or corrupted visible node headings");
      assert(!visibleTitles.some(text => text.includes("English translation unavailable")),
        view+" contains untranslated placeholder headings");
      const expandable = page.locator('[data-attribute-toggle]').first();
      if (await expandable.count()) {
        await expandable.click({timeout:15000});
        const headings = await page.locator(".node-attribute-heading").allTextContents();
        assert(!headings.some(text => CJK.test(text) || text.includes("�") ||
          text.includes("English translation unavailable")),
          view+" contains untranslated expanded attributes");
      }

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
    // Switching the top-level Atlas tabs must not reload the document or
    // discard the working position and selected node in the previous tree.
    await page.goto(base + "index.html?lang=en", {
      waitUntil:"networkidle", timeout:90000
    });
    await page.evaluate(() => { window.__atlasMountIdentity = "same-document"; });
    await page.locator('.tabs [data-graph="knowledge"]').click();
    await page.waitForFunction(() => document.body.dataset.atlasView === "knowledge");
    assert.equal(await page.evaluate(() => window.__atlasMountIdentity), "same-document",
      "Knowledge tab reloaded the Atlas document");
    await page.locator("#zoomIn").click();
    const knowledgeZoom = await page.locator("#zoomValue").innerText();
    await page.locator(".graph-node").first().click({timeout:15000});
    await page.waitForFunction(() => new URLSearchParams(location.search).has("focus"));
    const knowledgeFocus = await page.evaluate(() =>
      new URLSearchParams(location.search).get("focus"));
    assert(knowledgeFocus, "Could not focus a Knowledge node");
    for(const view of ["code","environment","context","core","knowledge"]) {
      await page.locator('.tabs [data-graph="' + view + '"]').click();
      await page.waitForFunction(name => document.body.dataset.atlasView === name, view);
      assert.equal(await page.evaluate(() => window.__atlasMountIdentity),
        "same-document", view + " loaded a new document");
      assert.equal(await page.evaluate(() => location.pathname.split("/").pop()),
        view + ".html", view + " has an incorrect deep-link URL");
      assert.equal(await page.locator(".tabs .tab.active").getAttribute("data-graph"),
        view, view + " has an incorrect active tab");
    }
    assert.equal(await page.locator("#zoomValue").innerText(), knowledgeZoom,
      "Knowledge zoom was discarded after a full five-tree round trip");
    assert.equal(await page.evaluate(() =>
      new URLSearchParams(location.search).get("focus")), knowledgeFocus,
      "Knowledge focus was discarded after a full five-tree round trip");
    await page.goBack({waitUntil:"domcontentloaded"});
    await page.waitForFunction(() => document.body.dataset.atlasView === "core");
    assert.equal(await page.evaluate(() => window.__atlasMountIdentity),
      "same-document", "Browser Back caused a page reload");
    await page.goForward({waitUntil:"domcontentloaded"});
    await page.waitForFunction(() => document.body.dataset.atlasView === "knowledge");
    assert.equal(await page.evaluate(() =>
      new URLSearchParams(location.search).get("focus")), knowledgeFocus,
      "Browser Forward lost Knowledge focus");
    await page.locator('#atlasLanguageSwitch button[data-lang="zh"]').click();
    await page.waitForFunction(() => document.documentElement.lang === "zh-CN");
    await page.locator('.tabs [data-graph="code"]').click();
    await page.locator('.tabs [data-graph="knowledge"]').click();
    assert.equal(await page.evaluate(() => document.documentElement.lang), "zh-CN",
      "Switching Atlas trees reset the selected language");
    assert.equal(await page.evaluate(() => window.__atlasMountIdentity),
      "same-document", "Switching languages and trees reloaded the document");
    console.log("In-place five-tree navigation, focus, zoom, language and history verified");

    // Verify actual nested SAR parameter meanings in the published locale.
    errors.length=0;
    await page.goto(base + "knowledge.html?lang=en&focus=g.sae.sar_adapter", {
      waitUntil:"networkidle", timeout:90000
    });
    const semantic=await page.evaluate(() => {
      const atlas=window.OPENRESEARCH_ATLAS;
      const node=atlas.knowledge.nodes.find(n=>n.id==="g.sae.sar_adapter");
      const reference=node?.attributes?.find(a=>a.type==="code_reference");
      const params=Object.fromEntries((reference?.interface?.parameters||[])
        .map(p=>[p.name,p.meaning]));
      const groups=atlas.code.nodes.filter(n=>n.kind==="group");
      return {params,groupSummaries:groups.map(n=>n.summary)};
    });
    for (const [key,word] of [
      ["p","coalition"], ["readout_position","Token"],
      ["verify_replay","baseline"], ["identity","SAEIdentity"]
    ]) {
      const description=semantic.params[key]||"";
      assert(description.includes(word),
        "SAR " + key + " lost its source-checked explanation: " + description);
      assert(!CJK.test(description) && !description.includes("translation unavailable"),
        "Untranslated SAR parameter: " + key);
    }
    assert(!semantic.groupSummaries.some(s =>
      /^Browse \\d+ source-backed child interfaces\\.$/.test(s)),
      "Published Code Tree still uses child-count-only explanations");
    assert.equal(errors.length,0,
      "SAR localization browser errors: "+errors.join(" | "));
    console.log("SAR parameters and functional Code group summaries verified in Chromium");

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
