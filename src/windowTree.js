
var WindowTreeRoot = class WindowTreeRoot {
    constructor() {
        this.base = null
    }

    addLeft(window,) {

    }

    addRight(window) {

    }

    addTop(window) {

    }

    addBottom(window) {

    }

    gueseBottomScale() {}
    gueseTopScale() {}
    gueseRightScale() {}
    gueseLeftScale() {}

    getParentOf(child) {
        includes(child)
    }

    // remove one child tree (if is not base)
    // remove overrided tree (Base:Vertical->Horizontal{windows}) => (Base:Vertical->windows)
    // merge tree (Base:Horizontal->Vertical{Win,Vertical{Win}}) => (Base:Horizontal->Vertical{Win,Win})
    flatten(parent,current) {
        if (!parent) {
            if (!this.base) return
            for (const child of this.base.children) this.flatten(this.base,child)
            const child = this.base.children[0]
            if (this.base.children.length === 1 && child instanceof WindowTree) {
                this.base = child
            }
            return
        }

        const indexInParent = parent.children.indexOf(current)
        if ((current instanceof WindowTree || current instanceof WindowTabs) && current.children.length <= 1) {
            // has no child or one child
            const child = current.children[0]
            if (!child) {
                // remove self from parent if current tree is empty
                parent.children.splice(indexInParent,1)
                parent.ratio.splice(indexInParent,1)
                parent.ratio = parent.ratio.map(v=>v*(parent.ratio.length+1)/parent.ratio.length)
            } else {
                // move child to parent and remove self, (keep ratio)
                parent.children.splice(indexInParent,1,child)
                // keep dfs going
                this.flatten(parent,child)
            }
            return
        } else if (current instanceof WindowTree && current.treeType === parent.treeType) {
            // parend type and current type is same, can be merged
            parent.children.splice(indexInParent,1,...current.children)
            const currentRatioInParent = parent.ratio[indexInParent]
            parent.ratio.splice(indexInParent,1,...current.ratio.map(r=>currentRatioInParent*r))
            // keep dfs going
            for (const child of current.children) this.flatten(parent,child)
            return
        } else if (current instanceof WindowTree || current instanceof WindowTabs) {
            // keep dfs going (if is not window)
            for (const child of current.children) {
                this.flatten(current,child)
            }
        }
    }

    // calculate sizes, positions
    calculateRatios(current) {
        if (!current) {
            if (!this.base) return
            this.base.rootScaleY = this.base.rootScaleX = 1
            this.base.rootPositionX = this.base.rootPositionY = 0
            if (this.base instanceof WindowTree) this.calculateRatios(this.base)
            return
        }

        let positionX = current.rootPositionX
        let positionY = current.rootPositionY
        for (let index=0; index<current.children.length; index++) {
            const child = current.children[index]
            child.rootPositionX = positionX
            child.rootPositionY = positionY
            child.rootScaleX = current.rootScaleX * (current.treeType === TreeTypes.Vertical   ? 1 : current.ratio[index])
            child.rootScaleY = current.rootScaleY * (current.treeType === TreeTypes.Horizontal ? 1 : current.ratio[index])
            if (current.treeType === TreeTypes.Horizontal) positionX += child.rootScaleX
            if (current.treeType === TreeTypes.Vertical  ) positionY += child.rootScaleY

            if (child instanceof WindowTree) this.calculateRatios(child)
            if (child instanceof WindowTabs) {
                for (const tabChild of child.children) {
                    tabChild.rootScaleX = child.rootScaleX
                    tabChild.rootScaleY = child.rootScaleY
                    tabChild.rootPositionX = child.rootPositionX
                    tabChild.rootPositionY = child.rootPositionY
                }
            }
        }
    }

    setBase(base) { this.base = base }

    // returns all window sizes
    renderRects() {

    }
}

var TreeTypes = {
    Vertical: 0,
    Horizontal: 1,
}

var SplitSide = {
    Left: 0,
    Right: 1,
}

var WindowTree = class WindowTree {
    constructor(treeType,window) {
        this.treeType = treeType
        this.children = window ? [ window ] : []
        this.ratio = window ? [ 1 ] : []

        this.rootScaleX = this.rootScaleY = null
        this.rootPositionX = this.rootPositionY = null
    }

    insertAt(windowOrTree,index) {
        const ratio = this.ratio.map(v=>v*this.ratio.length)
        this.children.splice(index,0,windowOrTree)
        ratio.splice(index,0,1)
        this.ratio = ratio.map(v=>v/ratio.length)
    }

    splitAt(target,side,window) {
        if (typeof target !== "number") this.children.indexOf(target)
        const newRatio = this.ratio[target] / 2
        this.ratio.splice(target,1,newRatio,newRatio)
        this.children.splice(target+side,0,window)
    }
}

var WindowTabs = class WindowTabs {
    constructor(window) {
        this.children = [ window ]
        this.rootScaleX = this.rootScaleY = null
    }
}

if (module) module.exports = { SplitSide, TreeTypes, WindowTabs, WindowTree, WindowTreeRoot } // For test
