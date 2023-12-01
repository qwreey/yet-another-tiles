
const { SplitSide, TreeTypes, WindowTabs, WindowTree, WindowTreeRoot } = require("../src/windowTree")
const { FakeWindow, EqualInEPSILON } = require("./utility")


{ // Scaling test
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
    
    root1.flatten() // 비어있는 (상위로 흡수될 수 있는) 트리를 제거합니다.
    root1.calculateRatios() // 각각 창들의 위치를 계산합니다.
    
    // 왼쪽 상단 창.
    if (
    EqualInEPSILON(tree2.children[0].rootPositionX, 0  )&&
    EqualInEPSILON(tree2.children[0].rootPositionY, 0  )&&
    EqualInEPSILON(tree2.children[0].rootScaleX   , 1/3)&&
    EqualInEPSILON(tree2.children[0].rootScaleY   , 1/2)) {
        console.log("windowTree.js:scaling ... LeftTop window PASS!")
    } else {
        console.log("windowTree.js:scaling ... LeftTop window FAIL!")
    }
    
    // 왼쪽 하단 창.
    if (
    EqualInEPSILON(tree2.children[1].rootPositionX, 0  )&&
    EqualInEPSILON(tree2.children[1].rootPositionY, 1/2)&&
    EqualInEPSILON(tree2.children[1].rootScaleX   , 1/3)&&
    EqualInEPSILON(tree2.children[1].rootScaleY   , 1/2)) {
        console.log("windowTree.js:scaling ... LeftBottom window PASS!")
    } else {
        console.log("windowTree.js:scaling ... LeftBottom window FAIL!")
    }
    
    // 중앙 창
    if (
    EqualInEPSILON(tree1.children[1].rootPositionX, 1/3)&&
    EqualInEPSILON(tree1.children[1].rootPositionY, 0  )&&
    EqualInEPSILON(tree1.children[1].rootScaleX   , 1/3)&&
    EqualInEPSILON(tree1.children[1].rootScaleY   , 1  )) {
        console.log("windowTree.js:scaling ... Middle window PASS!")
    } else {
        console.log("windowTree.js:scaling ... Middle window FAIL!")
    }
    
    // 마지막 창
    if (
    EqualInEPSILON(tree1.children[2].rootPositionX, 1/3*2)&&
    EqualInEPSILON(tree1.children[2].rootPositionY, 0    )&&
    EqualInEPSILON(tree1.children[2].rootScaleX   , 1/3  )&&
    EqualInEPSILON(tree1.children[2].rootScaleY   , 1    )) {
        console.log("windowTree.js:scaling ... Right window PASS!")
    } else {
        console.log("windowTree.js:scaling ... Right window FAIL!")
    }
}

{ // deep single child flatting
    let fakewin1,fakewin2,fakewin3
    const root1 = new WindowTreeRoot()
    const tree1 = new WindowTree(TreeTypes.Horizontal)

    // dummy on tree1
    tree1.insertAt(fakewin1 = new FakeWindow(),0)

    const tree1_2 = new WindowTree(TreeTypes.Vertical)
    const tree1_2_1 = new WindowTree(TreeTypes.Horizontal)
    const tree1_2_1_1 = new WindowTree(TreeTypes.Vertical)
    tree1.insertAt(tree1_2,2)
    tree1_2.insertAt(tree1_2_1,0)
    tree1_2_1.insertAt(tree1_2_1_1,0)
    tree1_2_1_1.insertAt(fakewin2 = new FakeWindow(),1)

    // dummy on tree1
    tree1.insertAt(fakewin3 = new FakeWindow(),2)

    root1.setBase(tree1)
    root1.flatten()

    console.log("windowTree.js:deep-single-child-flatting " +(
    root1.base.children[0] === fakewin1 &&
    root1.base.children[1] === fakewin2 &&
    root1.base.children[2] === fakewin3 &&
    EqualInEPSILON(root1.base.ratio[0],1/3) &&
    EqualInEPSILON(root1.base.ratio[1],1/3) &&
    EqualInEPSILON(root1.base.ratio[2],1/3) ? "PASS!" : "FAIL!"))
}

{ // deep no child flatting
    let fakewin1,fakewin2
    const root1 = new WindowTreeRoot()
    const tree1 = new WindowTree(TreeTypes.Horizontal)

    // dummy on tree1
    tree1.insertAt(fakewin1 = new FakeWindow(),0)

    const tree1_2 = new WindowTree(TreeTypes.Vertical)
    const tree1_2_1 = new WindowTree(TreeTypes.Horizontal)
    const tree1_2_1_1 = new WindowTree(TreeTypes.Vertical)
    tree1.insertAt(tree1_2,2)
    tree1_2.insertAt(tree1_2_1,0)
    tree1_2_1.insertAt(tree1_2_1_1,0)

    // dummy on tree1
    tree1.insertAt(fakewin2 = new FakeWindow(),2)

    root1.setBase(tree1)
    root1.flatten()

    console.log("windowTree.js:no-child-flatting " +(
    root1.base.children[0] === fakewin1 &&
    root1.base.children[1] === fakewin2 &&
    EqualInEPSILON(root1.base.ratio[0],1/2) &&
    EqualInEPSILON(root1.base.ratio[1],1/2) ? "PASS!" : "FAIL!"))
}

{ // complicated flatting
    let fakewin1,fakewin2,fakewin3

    const root1 = new WindowTreeRoot()
    const tree1 = new WindowTree(TreeTypes.Horizontal)

    const tree1_1 = new WindowTree(TreeTypes.Vertical)
    tree1.insertAt(tree1_1,0)
    const tree1_1_1 = new WindowTree(TreeTypes.Horizontal)
    tree1_1.insertAt(tree1_1_1,0)

    // dummy on tree1
    tree1.insertAt(fakewin1 = new FakeWindow(),1)

    const tree1_2 = new WindowTree(TreeTypes.Vertical)
    tree1.insertAt(tree1_2,2)
    const tree1_2_1 = new WindowTree(TreeTypes.Horizontal)
    tree1_2.insertAt(tree1_2_1,0)
    const tree1_2_1_1 = new WindowTree(TreeTypes.Vertical)
    tree1_2_1.insertAt(tree1_2_1_1,0)
    tree1_2_1_1.insertAt(fakewin2 = new FakeWindow(),1)

    // dummy on tree1
    tree1.insertAt(fakewin3 = new FakeWindow(),3)

    root1.setBase(tree1)
    root1.flatten()

    console.log("windowTree.js:complicated-flatting " +(
    root1.base.children[0] === fakewin1 &&
    root1.base.children[1] === fakewin2 &&
    root1.base.children[2] === fakewin3 &&
    EqualInEPSILON(root1.base.ratio[0],1/3) &&
    EqualInEPSILON(root1.base.ratio[1],1/3) &&
    EqualInEPSILON(root1.base.ratio[2],1/3) ? "PASS!" : "FAIL!"))
}

{ // merging flatting
    let fakewin1,fakewin2,fakewin3

    const root1 = new WindowTreeRoot()
    const tree1 = new WindowTree(TreeTypes.Vertical)

    const tree1_1 = new WindowTree(TreeTypes.Vertical)
    tree1.insertAt(tree1_1,0)
    tree1_1.insertAt(fakewin1 = new FakeWindow(),0)

    const tree1_1_1 = new WindowTree(TreeTypes.Vertical)
    tree1_1.insertAt(tree1_1_1,1)
    tree1_1_1.insertAt(fakewin2 = new FakeWindow(),0)
    tree1_1_1.insertAt(fakewin3 = new FakeWindow(),1)

    root1.setBase(tree1)
    root1.flatten()

    console.log("windowTree.js:merging-flatting " +(
    root1.base.children[0] === fakewin1 &&
    root1.base.children[1] === fakewin2 &&
    root1.base.children[2] === fakewin3 &&
    EqualInEPSILON(root1.base.ratio[0],1/2) &&
    EqualInEPSILON(root1.base.ratio[1],1/4) &&
    EqualInEPSILON(root1.base.ratio[2],1/4) ? "PASS!" : "FAIL!"))
}

{ // stairs flatting
    let fakewin1,fakewin2

    const root1 = new WindowTreeRoot()
    const tree1 = new WindowTree(TreeTypes.Vertical)

    const tree1_1 = new WindowTree(TreeTypes.Horizontal)
    tree1.insertAt(tree1_1,0)
    tree1_1.insertAt(fakewin1 = new FakeWindow(),0)

    const tree1_1_1 = new WindowTree(TreeTypes.Vertical)
    tree1_1.insertAt(tree1_1_1,1)
    tree1_1_1.insertAt(fakewin2 = new FakeWindow(),0)

    root1.setBase(tree1)
    root1.flatten()

    console.log("windowTree.js:stairs-flatting " +(
    root1.base.children[0] === fakewin1 &&
    root1.base.children[1] === fakewin2 &&
    EqualInEPSILON(root1.base.ratio[0],1/2) &&
    EqualInEPSILON(root1.base.ratio[1],1/2) ? "PASS!" : "FAIL!"))
}
