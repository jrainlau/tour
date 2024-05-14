import {
  SlotPosition,
  Options,
  HightlightElement,
  KeyNode
} from './d'

import {
  maskStyle,
  slotStyle,
  layerStyle
} from './utils'

const defaultOptions: Options = {
  prefix: 'smartour',
  padding: 5,
  maskColor: 'rgba(0, 0, 0, .5)',
  animate: true,
  slotPosition: SlotPosition.TOP
}

export default class Smartour {
  options: Options
  mask: HTMLElement
  slot: HTMLElement
  layer: HTMLElement
  tourList: Array<HightlightElement>
  tourListLength: number
  tourIndex: number

  constructor (options: Options = {}) {
    this.options = {
      ...defaultOptions,
      layerEvent: this.over.bind(this),
      ...options
    }

    this.mask = null
    this.slot = null
    this.layer = null
  }

  private _createMask () {
    if (!this.mask) {
      this.mask = document.createElement('div')
      this.mask.setAttribute('class', this.options.prefix + '-mask')
      this.mask.setAttribute('style', maskStyle(this.options.maskColor))
      document.body.appendChild(this.mask)
    }
  }

  private _createSlot (html: string) {
    if (!this.slot) {
      this.slot = document.createElement('div')
      this.slot.setAttribute('style', slotStyle())
      document.body.appendChild(this.slot)
    }
    this.slot.setAttribute('class', `${this.options.prefix}-slot ${this.options.prefix}-slot_${this.options.slotPosition}`)
    this.slot.innerHTML = html
  }

  private _createLayer () {
    if (!this.layer) {
      this.layer = document.createElement('div')
      this.layer.setAttribute('class', this.options.prefix + '-layer')
      this.layer.setAttribute('style', layerStyle())
      this.layer.addEventListener('click', this.options.layerEvent)
      document.body.appendChild(this.layer)
    }
  }

  private _setPosition (el: HTMLElement, attrs: Array<number>) {
    ;['top', 'left', 'width', 'height'].forEach((attr, index) => {
      if (attrs[index]) {
        if (attr === 'top' || attr === 'left') {
          const scrollDirection = `scroll${attr.charAt(0).toUpperCase() + attr.slice(1)}`
          let scrollDistance = 0
          if (document.documentElement && document.documentElement[scrollDirection]) {
            scrollDistance = document.documentElement[scrollDirection]
          } else {
            scrollDistance = document.body[scrollDirection]
          }
          el.style[attr] = attrs[index] + scrollDistance + 'px'
        } else {
          el.style[attr] = attrs[index] + 'px'
        }
      }
    })
  }

  private _show (targetSelector: string, slotHtml: string = '', keyNodes: Array<KeyNode> = []) {
    this._createMask()
    this._createSlot(slotHtml)
    this._createLayer()

    if (!this.options.animate) {
      this.mask.style.transition = null
      this.slot.style.transition = null
    }

    const target = document.querySelector(targetSelector)
    const { top, left, width, height } = target.getBoundingClientRect()
    const [maskTop, maskLeft, maskWidth, maskHeight] = [top - this.options.padding, left - this.options.padding, width + 2 * this.options.padding, height + 2 * this.options.padding]

    this._setPosition(this.mask, [maskTop, maskLeft, maskWidth, maskHeight])

    const { width: slotWidth, height: slotHeight } = this.slot.getBoundingClientRect()
    const { slotPosition } = this.options
    let [slotTop, slotLeft] = [0, 0]

    if (slotPosition === SlotPosition.TOP) {
      [slotTop, slotLeft] = [maskTop - slotHeight, maskLeft + maskWidth / 2 - slotWidth / 2]
    } else if (slotPosition === SlotPosition.BOTTOM) {
      [slotTop, slotLeft] = [maskTop + maskHeight, maskLeft + maskWidth / 2 - slotWidth / 2]
    } else if (slotPosition === SlotPosition.LEFT) {
      [slotTop, slotLeft] = [maskTop - (slotHeight - maskHeight) / 2, maskLeft - slotWidth]
    } else if (slotPosition === SlotPosition.RIGHT) {
      [slotTop, slotLeft] = [maskTop - (slotHeight - maskHeight) / 2, maskLeft + maskWidth]
    }

    this._setPosition(this.slot, [slotTop, slotLeft])
    if (!slotHtml) {
      document.body.removeChild(this.slot)
      this.slot = null
    }

    if (keyNodes.length) {
      keyNodes.forEach(({ el, event }) => {
        document.querySelector(el).addEventListener('click', event)
      })
    }
  }

  focus (highlightElement: HightlightElement = { el: '', slot: '', keyNodes: [], options: {} }) {
    if (highlightElement.options && Object.keys(highlightElement.options).length) {
      this.options = { ...this.options, ...highlightElement.options }
    }
    this._show(highlightElement.el, highlightElement.slot, highlightElement.keyNodes)
  }

  queue (tourList: Array<HightlightElement>) {
    this.tourList = tourList
    this.tourListLength = tourList.length
    this.tourIndex = -1

    return this
  }

  run () {
    if (this.tourListLength && this.tourIndex < this.tourListLength - 1) {
      this.tourIndex++
      const tour = this.tourList[this.tourIndex]
      if (tour.options) {
        this.options = { ...this.options, ...tour.options }
      }
      this._show(tour.el, tour.slot, tour.keyNodes)
    } else {
      this.over()
    }
  }

  next () {
    this.run()
  }

  prev () {
    if (this.tourIndex !== 0) this.tourIndex--
    const tour = this.tourList[this.tourIndex]
    if (tour.options) {
      this.options = { ...this.options, ...tour.options }
    }
    this._show(tour.el, tour.slot, tour.keyNodes)
  }

  over () {
    this.mask && document.body.removeChild(this.mask)
    this.slot && document.body.removeChild(this.slot)
    this.layer && document.body.removeChild(this.layer)

    ;['mask', 'slot', 'layer'].forEach(attr => {
      this[attr] = null
    })
  }
}
