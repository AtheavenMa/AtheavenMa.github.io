/* SAEBase Atlas: reconstruct the verified source graph without eval. */
(function(){
  const expected=22;
  const p=window.SAEBASE_ATLAS_PARTS;
  if(!Array.isArray(p)||p.length!==expected||p.some(x=>typeof x!=="string"))
    throw new Error("Incomplete SAEBase Atlas source snapshot");
  const g=JSON.parse(p.join(""));
  if(!String(g.context?.project||"").startsWith("SAEBase"))
    throw new Error("Foreign Atlas project rejected");
  window.OPENRESEARCH_ATLAS=g;
  delete window.SAEBASE_ATLAS_PARTS;
})();
