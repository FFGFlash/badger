# Badger

## Examples

### Favicons

```ts
import Badger, { Position } from '#ffgflash/badger'

const favicon = document.querySelector<HTMLLinkElement>('link[rel$=icon]')

const badger = new Badger({
  src: favicon.href,
  size: 0.7,
  radius: 10,
  position: Position.TOP_RIGHT,
})

badger.on('draw', url => {
  favicon.href = url
})
```
