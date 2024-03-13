import debug from 'debug'
import EventEmitter from 'eventemitter3'

const log = debug('badger')

export interface BadgerOptions {
  /** The url to the image we want to draw the badge on. */
  src?: string
  /** A value between 0 and 1 representing the size of the badge. */
  size?: number
  /** Where the badge should be positioned. */
  position?: keyof (typeof Badger)['Offsets']
  /** The border radius for the badge (pill). */
  radius?: number
  /** The background color for the badge (pill). */
  backgroundColor?: string | CanvasGradient | CanvasPattern
  /** The text color for the badge (pill). */
  color?: string | CanvasGradient | CanvasPattern
}

export interface BadgerEvents {
  /** Fired when the image is loaded and ready to be drawn */
  setup(): void
  /** Fired when the favicon is drawn to the canvas and the dataURL is ready to be used */
  draw(url: string): void
}

/**
 * Used to add a badge (pill) to a given image, this can be used to update a favicon and more.
 *
 * Inspired by Roko C. Buljan's answer on Stack Overflow. {@link https://stackoverflow.com/a/65720799 Reference}
 */
export default class Badger extends EventEmitter<BadgerEvents> {
  static DefaultOptions: Required<BadgerOptions> = {
    size: 0.6,
    position: 'topRight',
    src: '',
    radius: 8,
    backgroundColor: '#ef4444' as string | CanvasGradient | CanvasPattern,
    color: 'white' as string | CanvasGradient | CanvasPattern,
  }

  #options = Badger.DefaultOptions
  #canvas = document.createElement('canvas')
  #ctx = this.#canvas.getContext('2d')
  #offset = { x: 0, y: 0 }
  #value = 0
  #size = 0
  #image = new Image()
  #url!: string

  static Offsets = {
    top: { x: 0.5, y: 0 },
    right: { x: 1, y: 0.5 },
    bottom: { x: 0.5, y: 1 },
    left: { x: 0, y: 0.5 },
    topLeft: { x: 0, y: 0 },
    topRight: { x: 1, y: 0 },
    bottomRight: { x: 1, y: 1 },
    bottomLeft: { x: 0, y: 1 },
    center: { x: 0.5, y: 0.5 },
  }

  constructor(options?: BadgerOptions) {
    super()
    this.size = options?.size
    this.position = options?.position
    this.src = options?.src
    this.radius = options?.radius
    this.backgroundColor = options?.backgroundColor
    this.color = options?.color
    this.#image.addEventListener('load', () => {
      log('Source Loaded')
      this.setup()
      this.update()
    })
    this.src = this.#options.src
  }

  private setup() {
    const { naturalWidth, naturalHeight } = this.#image
    const minSize = Math.min(naturalWidth, naturalHeight)
    this.#size = minSize * this.size
    const right = this.#image.naturalWidth - this.#size
    const bottom = this.#image.naturalHeight - this.#size
    const offset = Badger.Offsets[this.position]
    this.#offset = { x: offset.x * right, y: offset.y * bottom }
    this.#canvas.width = this.#image.naturalWidth
    this.#canvas.height = this.#image.naturalHeight
    log(
      'Badger Setup\n- Size: %f\n- Offset: %f, %f',
      this.#size,
      this.#offset.x,
      this.#offset.y
    )
  }

  update() {
    const { naturalWidth, naturalHeight } = this.#image
    if (!this.#ctx) return
    this.#ctx.clearRect(0, 0, naturalWidth, naturalHeight)
    //* Draw favicon image
    this.#ctx.drawImage(this.#image, 0, 0, naturalWidth, naturalHeight)
    if (this.#value) {
      const radius = this.radius
      const { x, y } = this.#offset
      const right = x + this.#size
      const bottom = y + this.#size
      const margin = (this.#size * 0.18) / 2
      const centerX = x + this.#size / 2
      const centerY = y + this.#size / 2
      const fontSize = this.#size * 0.7
      //* Draw badge background
      this.#ctx.beginPath()
      this.#ctx.moveTo(right - radius, y)
      this.#ctx.quadraticCurveTo(right, y, right, y + radius)
      this.#ctx.lineTo(right, bottom - radius)
      this.#ctx.quadraticCurveTo(right, bottom, right - radius, bottom)
      this.#ctx.lineTo(x + radius, bottom)
      this.#ctx.quadraticCurveTo(x, bottom, x, bottom - radius)
      this.#ctx.lineTo(x, y + radius)
      this.#ctx.quadraticCurveTo(x, y, x + radius, y)
      this.#ctx.fillStyle = this.backgroundColor
      this.#ctx.fill()
      this.#ctx.closePath()
      //* Draw badge text
      this.#ctx.beginPath()
      this.#ctx.textBaseline = 'middle'
      this.#ctx.textAlign = 'center'
      this.#ctx.font = `bold ${fontSize}px Arial`
      this.#ctx.fillStyle = this.color
      this.#ctx.fillText(String(this.value), centerX, centerY + margin)
      this.#ctx.closePath()
    }
    //* Emit a draw event
    this.emit('draw', this.getURL())
  }

  private getURL() {
    return (this.#url = this.#canvas.toDataURL())
  }

  /** The number to render within the badge. */
  get value(): number {
    return this.#value
  }

  set value(value: number | undefined) {
    value = value ?? 0
    if (value === this.#value) return
    this.#value = Math.max(0, Math.min(value, 99))
    this.update()
  }

  /** The border radius for the badge (pill). */
  get radius(): number {
    return this.#options.radius
  }

  set radius(value: number | undefined) {
    value = value ?? Badger.DefaultOptions.radius
    if (value === this.radius) return
    this.#options.radius = value
    this.update()
  }

  /** A value between 0 and 1 representing the size of the badge. */
  get size(): number {
    return this.#options.size
  }

  set size(value: number | undefined) {
    value = Math.max(0, Math.min(value ?? Badger.DefaultOptions.size, 1))
    if (value === this.size) return
    this.#options.size = value
    if (!this.#image.complete) return
    this.setup()
    this.update()
  }

  /** The background color for the badge (pill). */
  get backgroundColor(): string | CanvasGradient | CanvasPattern {
    return this.#options.backgroundColor
  }

  set backgroundColor(
    value: string | CanvasGradient | CanvasPattern | undefined
  ) {
    value = value ?? Badger.DefaultOptions.backgroundColor
    if (value === this.backgroundColor) return
    this.#options.backgroundColor = value
    this.update()
  }

  /** The text color for the badge (pill). */
  get color(): string | CanvasGradient | CanvasPattern {
    return this.#options.color
  }

  set color(value: string | CanvasGradient | CanvasPattern | undefined) {
    value = value ?? Badger.DefaultOptions.color
    if (value === this.color) return
    this.#options.color = value
    this.update()
  }

  /** The url to the image we want to draw the badge on. */
  get src(): string {
    return this.#image.src
  }

  set src(value: string | undefined) {
    value = value ?? Badger.DefaultOptions.src
    if (value === this.src) return
    this.#image.src = value
  }

  /** Where the badge should be positioned. */
  get position(): keyof (typeof Badger)['Offsets'] {
    return this.#options.position
  }

  set position(value: keyof (typeof Badger)['Offsets'] | undefined) {
    value = value ?? Badger.DefaultOptions.position
    if (value === this.position) return
    this.#options.position = value
    this.setup()
    this.update()
  }

  /** The data url for the most recent draw call. */
  get url() {
    return this.#url ?? this.getURL()
  }
}
