const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../electron/shotcat-core.cjs');

test('supports images',()=>{
  assert.equal(core.isSupported('a.PNG'),true);
  assert.equal(core.isSupported('a.webp'),true);
  assert.equal(core.isSupported('a.pdf'),false);
});

test('preset',()=>{
  assert.deepEqual(core.getPreset('xhs34'),{width:1080,height:1440,label:'小红书 3:4'});
});

test('export name',()=>{
  assert.equal(core.exportName('C:/x/demo.png','square'),'demo_ShotCat_1080x1080.png');
});
