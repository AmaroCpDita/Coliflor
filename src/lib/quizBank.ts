// ============================================================
// Coliflor — Date-Aware & Seasonally Tailored Daily Quiz Bank
// Rotates & mixes questions with seasonal & holiday touches
// ============================================================

import type { DailyQuiz, QuizQuestion } from './types';

export const QUESTION_POOL: { category: string; question: QuizQuestion; season?: string }[] = [
  // --- Categoría: Intimidad & Pasión ---
  {
    category: 'Intimidad & Pasión',
    question: {
      id: 'int-1',
      question: '¿Cómo te gusta que tu pareja tome la iniciativa en la intimidad?',
      options: [
        'Con un beso apasionado de la nada y contacto firme',
        'Susurrándome cosas atrevidas al oído durante el día',
        'Abrazándome suavecito y empezando con mimos lentos',
        'Poniéndose algo sexy o preparando el ambiente a oscuras',
      ],
    },
  },
  {
    category: 'Intimidad & Pasión',
    question: {
      id: 'int-2',
      question: 'Probar un juego de roles o fantasía en la cama, ¿qué te produce?',
      options: [
        'Me prende caleta, ¡hagámoslo ya!',
        'Me da curiosidad, pero me daría un poco de risa al principio',
        'No lo sé, tendría que estar en el ambiente adecuado',
        'Prefiero que seamos nosotros mismos sin personajes',
      ],
    },
  },
  {
    category: 'Intimidad & Pasión',
    question: {
      id: 'int-3',
      question: 'Si te mando un mensaje o foto provocativa a mitad del día laboral:',
      options: [
        'Me desconcentro altiro y cuento las horas para verte',
        'Te respondo con otro igual o más provocativo',
        'Me sonrojo y lo guardo para la noche',
        'Te escribo: "Espérate a que llegue a la casa..."',
      ],
    },
  },
  {
    category: 'Intimidad & Pasión',
    question: {
      id: 'int-4',
      question: '¿Qué prefieres para cerrar una noche de mucha pasión?',
      options: [
        'Quedarnos abrazados piel con piel hasta dormirnos',
        'Una ducha caliente juntos a solas',
        'Conversar muertos de la risa y comer algo rico',
        'Un segundo round después de tomar agua',
      ],
    },
  },
  {
    category: 'Intimidad & Pasión',
    question: {
      id: 'int-5',
      question: 'Hacerlo en un lugar con riesgo a solas (ej: auto, playa, balcón):',
      options: [
        'La adrenalina me enciende al 100%',
        'Un riesgo pequeñito sí, pero no tan extremo',
        'Me daría un poco de nervio pero me tienta',
        'Prefiero la comodidad de nuestra cama',
      ],
    },
  },

  // --- Categoría: Preferencias & "¿Cómo te gusta que...?" ---
  {
    category: 'Preferencias de Pareja',
    question: {
      id: 'pref-1',
      question: '¿Cómo te gusta que tu pareja te consienta cuando llegas agotado/a?',
      options: [
        'Que me tenga la comida lista o pidamos algo rico',
        'Un masaje largo en la espalda o pies sin pedirlo',
        'Un abrazo apretado en silencio en la cama',
        'Que me ponga mi serie favorita y me haga cariñitos',
      ],
    },
  },
  {
    category: 'Preferencias de Pareja',
    question: {
      id: 'pref-2',
      question: '¿Cómo te gusta que tu pareja te bese en privado?',
      options: [
        'Besos lentos, profundos y con respiración agitada',
        'Besos mordisqueando suavemente el labio inferior',
        'Besos tiernos y repetidos en todo el rostro y cuello',
        'Besos apasionados y robados sin previo aviso',
      ],
    },
  },
  {
    category: 'Preferencias de Pareja',
    question: {
      id: 'pref-3',
      question: '¿Cómo te gusta que tu pareja te despierte los fines de semana?',
      options: [
        'Con besitos suaves en el cuello y abrazos',
        'Llevándome el desayuno o un café a la cama',
        'Con insinuaciones coquetas bajo las sábanas',
        'Dejándome dormir todo lo que quiera en silencio',
      ],
    },
  },
  {
    category: 'Preferencias de Pareja',
    question: {
      id: 'pref-4',
      question: '¿Cómo te gusta que tu pareja te demuestre amor en público?',
      options: [
        'Tomarme la mano o ponerme el brazo encima',
        'Mirarme con complicidad y picarme el ojo a lo lejos',
        'Decir cosas lindas de mí enfrente de los demás',
        'Ser discretos afuera y 100% cariñosos a solas',
      ],
    },
  },
  {
    category: 'Preferencias de Pareja',
    question: {
      id: 'pref-5',
      question: '¿Cómo te gusta que tu pareja reaccione si estás de mal humor?',
      options: [
        'Que me escuche pacientemente sin juzgarme',
        'Que me dé mi espacio unos minutos y luego me abrace',
        'Que me intente hacer reír con alguna ocurrencia tierno/a',
        'Que me traiga algo rico para comer o tomar',
      ],
    },
  },

  // --- Categoría: Citas & Panoramas ---
  {
    category: 'Citas & Panoramas',
    question: {
      id: 'cit-1',
      question: '¿Cuál sería nuestra cita perfecta de fin de semana?',
      options: [
        'Ir a probar comida nueva a un lugar bonito',
        'Quedarnos en casa viendo series y pidiendo delivery',
        'Un panorama al aire libre o caminata corta',
        'Noche de tragos, conversación y risas',
      ],
    },
  },
  {
    category: 'Citas & Panoramas',
    question: {
      id: 'cit-2',
      question: 'A la hora de elegir qué comer juntos:',
      options: [
        'Sushi o comida japonesa',
        'Comida chatarra rica (pizzas/hamburguesas)',
        'Algo casero preparado entre los dos',
        'Lo que tú quieras, me adapto a todo',
      ],
    },
  },
  {
    category: 'Citas & Panoramas',
    question: {
      id: 'cit-3',
      question: '¿Qué tipo de sorpresas te hacen más feliz?',
      options: [
        'Un detalle hecho a mano o una notita dulce',
        'Que me traigas mi comida o postre favorito',
        'Un viaje o panorama planeado en secreto',
        'Un abrazo inesperado y palabras de amor',
      ],
    },
  },

  // --- Categoría: Sueños & Convivencia ---
  {
    category: 'Sueños & Convivencia',
    question: {
      id: 'sue-1',
      question: '¿Cuál es nuestro mayor superpoder como pareja?',
      options: [
        'Nos reímos de cualquier cosa juntos',
        'Nos apoyamos incondicionalmente en todo',
        'La química y atracción que tenemos',
        'Sabemos resolver problemas conversando',
      ],
    },
  },
  {
    category: 'Sueños & Convivencia',
    question: {
      id: 'sue-2',
      question: 'Si planificáramos unas vacaciones soñadas juntos:',
      options: [
        'Un resort relajante todo incluido',
        'Un viaje mochilero explorando ciudades nuevas',
        'Una cabaña rústica aislada en el sur',
        'Un viaje largo internacional',
      ],
    },
  },
  {
    category: 'Sueños & Convivencia',
    question: {
      id: 'sue-3',
      question: '¿Cómo imaginas nuestro lugar soñado para vivir juntos?',
      options: [
        'Un departamento moderno en la ciudad',
        'Una casa acogedora con patio para mascotas',
        'Una casa cerca de la playa con vista al mar',
        'Un lugar tranquilo en el campo rodeado de naturaleza',
      ],
    },
  },

  // --- Categoría: Invierno (Junio, Julio, Agosto) ---
  {
    category: 'Especial Invierno',
    season: 'winter',
    question: {
      id: 'inv-1',
      question: 'En un día frío o lluvioso de invierno, ¿cuál es nuestro mejor panorama a solas?',
      options: [
        'Quedarnos tapaditos en la cama todo el día regaloneando',
        'Preparar chocolates calientes o sopapillas juntos',
        'Ver maratón de películas con estufa prendida',
        'Darse un baño de tina o ducha caliente juntos',
      ],
    },
  },
  {
    category: 'Especial Invierno',
    season: 'winter',
    question: {
      id: 'inv-2',
      question: '¿Cómo te gusta dormir en las noches heladas de invierno?',
      options: [
        'Enganchados en un abrazo apretado cara a cara',
        'Haciendo cucharita donde tú me abrigues',
        'Con los pies helados buscando el calor del otro',
        'Bien tapados cada uno a su lado pero tocándonos las manos',
      ],
    },
  },

  // --- Categoría: Primavera (Septiembre, Octubre, Noviembre) ---
  {
    category: 'Especial Primavera',
    season: 'spring',
    question: {
      id: 'pri-1',
      question: 'Con los días soleados y la brisa primaveral, ¿qué panorama te tienta más?',
      options: [
        'Un picnic en el parque con mantita y cositas ricas',
        'Una caminata o heladito por la tarde al atardecer',
        'Ir a tomar algo a una terraza linda al aire libre',
        'Escapada de fin de semana al campo o la playa',
      ],
    },
  },

  // --- Categoría: Verano (Diciembre, Enero, Febrero) ---
  {
    category: 'Especial Verano',
    season: 'summer',
    question: {
      id: 'ver-1',
      question: 'En una noche calurosa de verano, ¿qué es lo más rico para hacer juntos?',
      options: [
        'Tomarse algo helado conversando bajo las estrellas',
        'Bañarse en la piscina o mar de noche a solas',
        'Dormir ligeros de ropa con el ventilador/aire',
        'Salir a caminar tarde cuando refresca',
      ],
    },
  },

  // --- Categoría: Otoño (Marzo, Abril, Mayo) ---
  {
    category: 'Especial Otoño',
    season: 'autumn',
    question: {
      id: 'oto-1',
      question: 'Con las tardes frescas de otoño, ¿qué antojo disfrutas más en pareja?',
      options: [
        'Un café o té bien caliente platicando de la vida',
        'Preparar una cenita casera rica entre los dos',
        'Caminar entre las hojas secas abrazados',
        'Acostarse temprano a ver una serie con un abrigo',
      ],
    },
  },

  // --- Categoría: Fiestas Navideñas (Diciembre) ---
  {
    category: 'Especial Navideño',
    season: 'christmas',
    question: {
      id: 'nav-1',
      question: '¿Qué es lo que más te emociona de vivir la Navidad juntos?',
      options: [
        'Elegir o preparar una sorpresa especial a escondidas',
        'Armar el árbol y la casa escuchando música alegre',
        'La cena navideña a medianoche con brindar',
        'Quedarnos solitos al final de la noche abriendo regalos',
      ],
    },
  },
];

/**
 * Gets a dynamically mixed daily quiz based on the current date in Santiago timezone.
 * Selects 5 varied questions combining Intimacy, Preferences, Dates, Dreams, and Season.
 */
export function getDailyQuiz(dateStr: string): DailyQuiz {
  const dateParts = dateStr.split('-');
  const yearNum = parseInt(dateParts[0] || '2026', 10);
  const monthNum = parseInt(dateParts[1] || '1', 10);
  const dayNum = parseInt(dateParts[2] || '1', 10);

  // Determine Southern Hemisphere Season (Chile)
  let seasonKey = 'winter'; // Jun, Jul, Aug
  let seasonLabel = 'Invierno & Sintonía de Pareja';
  let subtitleText = '5 preguntas para conocernos más hoy';

  if (monthNum === 12 && dayNum >= 20 && dayNum <= 25) {
    seasonKey = 'christmas';
    seasonLabel = 'Especial Navideño & Sintonía';
    subtitleText = 'Preguntas de complicidad en fiestas';
  } else if (monthNum === 6 || monthNum === 7 || monthNum === 8) {
    seasonKey = 'winter';
    seasonLabel = 'Sintonía de Invierno & Pareja';
    subtitleText = 'Preguntas acogedoras para días fríos';
  } else if (monthNum === 9 || monthNum === 10 || monthNum === 11) {
    seasonKey = 'spring';
    seasonLabel = 'Sintonía de Primavera & Pareja';
    subtitleText = 'Preguntas de brisa y panoramas de sol';
  } else if (monthNum === 12 || monthNum === 1 || monthNum === 2) {
    seasonKey = 'summer';
    seasonLabel = 'Sintonía de Verano & Pasión';
    subtitleText = 'Preguntas de calor, playa y noches de verano';
  } else if (monthNum === 3 || monthNum === 4 || monthNum === 5) {
    seasonKey = 'autumn';
    seasonLabel = 'Sintonía de Otoño & Pareja';
    subtitleText = 'Preguntas de tardes acogedoras y café';
  }

  const seed = dayNum * 7 + monthNum * 13 + yearNum;

  // Filter questions including general + current season questions
  const availablePool = QUESTION_POOL.filter(
    q => !q.season || q.season === seasonKey
  );

  const selectedQuestions: QuizQuestion[] = [];
  const total = availablePool.length;

  for (let i = 0; i < 5; i++) {
    const qIndex = (seed + i * 3) % total;
    selectedQuestions.push(availablePool[qIndex].question);
  }

  return {
    id: `daily-quiz-${dateStr}`,
    theme: seasonLabel,
    subtitle: subtitleText,
    questions: selectedQuestions,
  };
}
