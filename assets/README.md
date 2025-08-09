# Chess Application Assets

This chess application uses Unicode chess symbols for pieces and CSS gradients for board themes, making it lightweight and requiring no external image files.

## Current Implementation

### Chess Pieces
The application uses Unicode chess symbols:
- White: ♔ ♕ ♖ ♗ ♘ ♙
- Black: ♚ ♛ ♜ ♝ ♞ ♟

### Board Themes
Three CSS-based themes are implemented:
1. **Classic Green**: Traditional chess board colors
2. **Wood**: Wood grain effect using CSS gradients
3. **Marble**: Marble texture effect using CSS gradients

## Extending with Custom Assets

### Adding SVG Chess Pieces

To use custom SVG pieces instead of Unicode:

1. Place SVG files in `/assets/pieces/` with naming convention:
   - `white-king.svg`, `white-queen.svg`, etc.
   - `black-king.svg`, `black-queen.svg`, etc.

2. Update `ui-controller.js` createPieceElement method:
```javascript
const pieceElement = document.createElement('img');
pieceElement.src = `/assets/pieces/${piece.color}-${pieceMap[piece.type]}.svg`;
```

### Adding Board Textures

To add image-based board textures:

1. Place texture images in `/assets/boards/`:
   - `wood-light.jpg`, `wood-dark.jpg`
   - `marble-light.jpg`, `marble-dark.jpg`

2. Update `styles.css` with background-image properties:
```css
.theme-wood .square.light {
    background-image: url('/assets/boards/wood-light.jpg');
}
```

### Recommended Free Resources

#### Chess Piece Sets (SVG)
- Wikimedia Commons Chess Pieces
- Chess.com piece sets (with attribution)
- Lichess piece sets (open source)

#### Board Textures
- Unsplash (free textures)
- Pexels (wood and marble textures)
- TextureHaven (CC0 textures)

## Icon Assets

UI control icons can be added to `/assets/icons/` for:
- New Game
- Undo
- Flip Board
- Settings

Currently using inline SVG for maximum performance and no dependencies.