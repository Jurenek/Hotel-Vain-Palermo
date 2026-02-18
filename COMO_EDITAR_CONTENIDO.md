# Sistema de Gestión de Contenido - VAIN Hotel App

## Cómo Agregar/Editar/Borrar Recomendaciones

### Archivo Principal
Todo el contenido editable está en: **`lib/content.ts`**

### Agregar una Nueva Experiencia

1. Abrí `lib/content.ts`
2. Agregá un nuevo objeto al array `experiences`:

```typescript
{
  id: 6, // Número siguiente
  title: 'Nombre de la Experiencia',
  venue: 'Lugar/Barrio',
  description: 'Descripción breve',
  time: '20:00',
  price: 'USD 50',
  icon: 'Music', // Music, Wine, UtensilsCrossed, Palette
  category: 'food', // tango, food, art, nightlife
  bookable: true, // true = podemos reservar, false = solo recomendación
  rating: 4.7, // Opcional
  distance: '10 min walk', // Opcional
}
```

### Cambiar si es Reservable o Solo Recomendación

- **`bookable: true`** → Muestra badge verde "✓ Reserva disponible"
- **`bookable: false`** → Muestra badge amber "⭐ Recomendación"

### Ejemplo: Don Julio

```typescript
{
  id: 5,
  title: 'Don Julio Parrilla',
  venue: 'Palermo Soho',
  description: 'Mejor parrilla de Buenos Aires - Recomendación top',
  time: 'Varios horarios',
  price: 'USD 60-80',
  icon: 'UtensilsCrossed',
  category: 'food',
  bookable: false, // ← SOLO RECOMENDACIÓN, no hacemos reserva
  rating: 4.9,
  distance: '5 min walk',
}
```

### Lugares Cercanos (Nearby Places)

Editá el array `nearbyPlaces` en el mismo archivo:

```typescript
{
  name: 'Nombre del Lugar',
  distance: '5 min walk',
  category: 'Tipo',
  rating: 4.8,
  bookable: true, // true/false
}
```

### Borrar una Recomendación

1. Abrí `lib/content.ts`
2. Eliminá el objeto completo del array
3. Guardá el archivo

### Después de Editar

1. **Build:** `npm run build`
2. **Deploy:** `npx vercel --prod`

---

## Próximas Mejoras

### Panel Admin (Futuro)

En lugar de editar archivos, podríamos crear:

1. **Página `/admin`** protegida con contraseña
2. **Formulario web** para agregar/editar/borrar
3. **Base de datos** (Supabase o Firebase)
4. **Cambios en vivo** sin rebuild

¿Te interesa implementar esto?

---

## Estructura Actual

```
lib/
├── content.ts          ← EDITAR AQUÍ
├── store.ts           ← Estado de usuario
├── types.ts           ← Tipos TypeScript
└── utils.ts           ← Funciones utilitarias

app/
├── experiences/
│   └── page.tsx       ← Lee de content.ts
└── concierge/
    └── page.tsx       ← Formulario de reservas
```

---

## Tips

- **Iconos disponibles:** Music, Wine, UtensilsCrossed, Palette
- **Categorías:** tango, food, art, nightlife
- **Ratings:** 1.0 a 5.0
- **Distancias:** "X min walk", "X min taxi", etc
- **Precios:** Formato libre (USD 50, ARS 10000, Gratis, etc)
