// Datos de experiencias y lugares de Palermo
// Este archivo puede ser editado para agregar/quitar recomendaciones

export interface Experience {
    id: number;
    title: string;
    venue: string;
    description: string;
    time: string;
    price: string;
    icon: string;
    category: 'tango' | 'food' | 'art' | 'nightlife';
    bookable: boolean; // true = podemos hacer reserva, false = solo recomendación
    rating?: number;
    distance?: string;
}

export const experiences: Experience[] = [
    {
        id: 1,
        title: 'Cena Show de Tango',
        venue: 'El Querandi',
        description: 'Experiencia auténtica de tango con cena de 3 pasos',
        time: '20:30',
        price: 'USD 95',
        icon: 'Music',
        category: 'tango',
        bookable: true, // VAIN puede hacer reserva
        rating: 4.8,
    },
    {
        id: 2,
        title: 'Milonga La Catedral',
        venue: 'Almagro',
        description: 'Milonga auténtica para bailar tango - Fácil de reservar',
        time: '23:00',
        price: 'USD 15',
        icon: 'Music',
        category: 'tango',
        bookable: true, // VAIN puede ayudar
        rating: 4.9,
    },
    {
        id: 3,
        title: 'Wine Tasting Tour',
        venue: 'Palermo Viejo',
        description: 'Degustación de vinos argentinos con sommelier',
        time: '18:00',
        price: 'USD 75',
        icon: 'Wine',
        category: 'food',
        bookable: true,
        rating: 4.7,
    },
    {
        id: 4,
        title: 'Galería Tour',
        venue: 'Circuito Palermo Soho',
        description: 'Recorrido por galerías de arte contemporáneo',
        time: '15:00',
        price: 'USD 40',
        icon: 'Palette',
        category: 'art',
        bookable: true,
        rating: 4.6,
    },
    {
        id: 5,
        title: 'Don Julio Parrilla',
        venue: 'Palermo Soho',
        description: 'Mejor parrilla de Buenos Aires - Recomendación top',
        time: 'Varios horarios',
        price: 'USD 80-100',
        icon: 'UtensilsCrossed',
        category: 'food',
        bookable: false, // Solo recomendación, no hacemos reserva
        rating: 4.9,
        distance: '5 min walk',
    },
];

export interface NearbyPlace {
    name: string;
    distance: string;
    category: string;
    rating: number;
    bookable: boolean;
}

export const nearbyPlaces: NearbyPlace[] = [
    {
        name: 'Don Julio',
        distance: '5 min walk',
        category: 'Parrilla',
        rating: 4.9,
        bookable: false,
    },
    {
        name: 'Proper',
        distance: '3 min walk',
        category: 'Cocktail Bar',
        rating: 4.8,
        bookable: true,
    },
    {
        name: 'La Cabrera',
        distance: '8 min walk',
        category: 'Parrilla',
        rating: 4.7,
        bookable: false,
    },
    {
        name: 'Café Tortoni',
        distance: '15 min taxi',
        category: 'Café Histórico',
        rating: 4.6,
        bookable: true,
    },
];

// Para agregar/editar lugares:
// 1. Editar este archivo directamente
// 2. Cambiar bookable: true/false según si VAIN puede hacer reserva
// 3. Rebuild y deploy
//
// Próxima versión: Panel admin para editar desde la web
