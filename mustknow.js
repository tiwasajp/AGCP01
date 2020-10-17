// 値のコピー
var a = 1;
var b = 2;
a = b;
b = 5;
console.log(`a=${a} b=${b}`);
//a=2 b=5 となる

// オブジェクトのインデックスのコピー
var a = {x:1, y:2};
var b = {x:3, y:4};
a = b;
console.log(`a.x=${a.x}`);
// a.x=3 となる
b.x = 5;
console.log(`a.x=${a.x}`);　
// a.x=5 となる。b.x = 5 としたのに、aのオブジェクトの値が変わっている。つまり、a = bで、aとbは同じオブジェクトを指すことになる。C/C++のポインターの概念と同じ。



//returnでオブジェクトを返すことができる。(評価式? 真の場合 : 偽の場合)の利用も便利
const func = (loc) => {return {result:(loc === "Tokyo" ? "Osaka" : "Tokyo")}};
console.log(func("Osaka").result);


// JavaScriptは基本的に各ステップでの処理を待たない。特定の範囲で処理を待つ場合はPromise（methodによってすでに埋め込まれていることもある）, async, awaitを使う
// 実行結果は以下となる。なぜこの順番になるかを理解できれば、Promise, async, awaitの使い方を理解したと言えます
//   step 1
//   step 2
//   step 5
//   step 6
//   timeout 5
//   timeout 2
//   timeout 2.1
//   timeout 2.2
//   step 3
//   timeout 3
//   timeout 3.1
//   step 4

const sleep = (msec, func) => {
  return new Promise((resolve) => setTimeout(() => {func(); resolve();}, msec));
}

console.log("step 1");
(async () => {
  console.log("step 2");
  await sleep(2000, () => {console.log("timeout 2");}).then(()=>{console.log("timeout 2.1");}).then(()=>{console.log("timeout 2.2");});
  console.log("step 3");
  await sleep(2000, () => {console.log("timeout 3");}).then(()=>{console.log("timeout 3.1");});
  console.log("step 4");
})();
console.log("step 5");
sleep(1000, () => {console.log("timeout 5");});
console.log("step 6");
