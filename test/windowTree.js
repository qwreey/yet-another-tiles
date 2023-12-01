
const { SplitSide, TreeTypes, WindowTabs, WindowTree, WindowTreeRoot } = require("../src/windowTree")
const { FakeWindow, EqualInEPSILON } = require("./utility")

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

root1.clean() // 비어있는 (상위로 흡수될 수 있는) 트리를 제거합니다.
root1.calculateRatios() // 각각 창들의 위치를 계산합니다.

// 왼쪽 상단 창.
if (
EqualInEPSILON(tree2.children[0].rootPositionX, 0  )&&
EqualInEPSILON(tree2.children[0].rootPositionY, 0  )&&
EqualInEPSILON(tree2.children[0].rootScaleX   , 1/3)&&
EqualInEPSILON(tree2.children[0].rootScaleY   , 1/2)) {
    console.log("windowTree.js ... LeftTop window PASS!")
} else {
    console.log("windowTree.js ... LeftTop window FAILED!")
}

// 왼쪽 하단 창.
if (
EqualInEPSILON(tree2.children[1].rootPositionX, 0  )&&
EqualInEPSILON(tree2.children[1].rootPositionY, 1/2)&&
EqualInEPSILON(tree2.children[1].rootScaleX   , 1/3)&&
EqualInEPSILON(tree2.children[1].rootScaleY   , 1/2)) {
    console.log("windowTree.js ... LeftBottom window PASS!")
} else {
    console.log("windowTree.js ... LeftBottom window FAILED!")
}

// 중앙 창
if (
EqualInEPSILON(tree1.children[1].rootPositionX, 1/3)&&
EqualInEPSILON(tree1.children[1].rootPositionY, 0  )&&
EqualInEPSILON(tree1.children[1].rootScaleX   , 1/3)&&
EqualInEPSILON(tree1.children[1].rootScaleY   , 1  )) {
    console.log("windowTree.js ... Middle window PASS!")
} else {
    console.log("windowTree.js ... Middle window FAILED!")
}

// 마지막 창
if (
EqualInEPSILON(tree1.children[2].rootPositionX, 1/3*2)&&
EqualInEPSILON(tree1.children[2].rootPositionY, 0    )&&
EqualInEPSILON(tree1.children[2].rootScaleX   , 1/3  )&&
EqualInEPSILON(tree1.children[2].rootScaleY   , 1    )) {
    console.log("windowTree.js ... Right window PASS!")
} else {
    console.log("windowTree.js ... Right window FAILED!")
}
