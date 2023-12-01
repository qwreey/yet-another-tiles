
const { SplitSide, TreeTypes, WindowTabs, WindowTree, WindowTreeRoot } = require("../src/windowTree")
const { FakeWindow } = require("./utility")
const { EPSILON } = Number


const root1 = new WindowTreeRoot()
const tree1 = new WindowTree(TreeTypes.Horizontal)
const tree2 = new WindowTree(TreeTypes.Vertical)
const tree3 = new WindowTree(TreeTypes.Vertical)

root1.setBase(tree1)
tree1.insertAt(tree2,0)
tree1.insertAt(tree3,1)
tree1.insertAt(new FakeWindow(),2)

tree2.insertAt(new FakeWindow(),0)
tree2.insertAt(new FakeWindow(),1)
tree3.insertAt(new FakeWindow(),0)

// console.log(JSON.stringify(root1,null,'  '))
// console.log(root1)
root1.clean()
// console.log(JSON.stringify(root1,null,'  '))
// console.log(root1)
root1.calculateRatios()
// console.log(root1)
console.log(JSON.stringify(root1,null,'  '))
