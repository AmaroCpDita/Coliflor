// ============================================================
// Coliflor — Date-Aware & Seasonally Tailored Daily Quiz Bank
// Rotates whole themed quizzes instead of individual questions
// ============================================================

import type { DailyQuiz, QuizQuestion } from './types';
import { NEW_QUIZZES, QUIZ_SERIES_START } from './quizSeries';

export interface ThemedQuiz {
  theme: string;
  subtitle: string;
  season?: 'summer' | 'winter' | 'spring' | 'autumn' | 'christmas';
  questions: Omit<QuizQuestion, 'id'>[];
}

export const THEMED_QUIZZES: ThemedQuiz[] = [
  {
    theme: 'Noches de Chat',
    subtitle: 'Nuestras conversaciones cuando no estamos juntos',
    questions: [
      {
        question:
          'Cuando nos quedamos hablando hasta tarde por chat, ¿qué es lo que más disfrutas?',
        options: [
          'Que se nos pasa el tiempo volando sin darnos cuenta',
          'Cuando nos ponemos profundos y hablamos de la vida',
          'Los coqueteos y mensajes más atrevidos de madrugada',
          'Cuando nos mandamos memes y videos sin parar',
        ],
      },
      {
        question: '¿Qué prefieres recibir de mí cuando estás ocupado/a estudiando o trabajando?',
        options: [
          "Un mensajito corto de 'te extraño' o ánimos",
          'Un audio contándome algo chistoso que te pasó',
          'Un meme o video para desconectar un rato',
          'Que me des mi espacio hasta que me desocupe',
        ],
      },
      {
        question: "Si te dejo en 'visto' sin querer por un buen rato:",
        options: [
          'Me da igual, sé que debes estar ocupado/a',
          'Me paso un poco de rollos al principio',
          'Te mando otro mensaje para molestarte',
          'Te devuelvo la misma moneda después',
        ],
      },
      {
        question: 'Sobre las videollamadas antes de dormir:',
        options: [
          'Me encantan, me gusta verte la cara antes de dormir',
          'Prefiero llamadas normales, me da flojera arreglarme',
          'Son ricas de vez en cuando, no para todos los días',
          'Prefiero puro chat de texto, soy más de escribir',
        ],
      },
      {
        question: '¿Cuál es tu forma favorita de decirme buenas noches por mensaje?',
        options: [
          'Un texto largo y tierno deseándome lindos sueños',
          "Un 'descansa amor' con muchos emojis",
          'Un audio con voz de tuto',
          'Un sticker chistoso o tierno de buenas noches',
        ],
      },
    ],
  },
  {
    theme: 'Maratón y Sillón',
    subtitle: 'Compartiendo series y películas a distancia o juntos',
    questions: [
      {
        question:
          'Si estamos viendo una serie juntos (cada uno en su casa) y yo adelanto un capítulo:',
        options: [
          '¡Te mato! Es una traición imperdonable',
          'Me da un poco de lata, pero te obligo a verlo de nuevo conmigo',
          'Me da igual, yo también lo he hecho',
          'Te pido que me cuentes qué pasa porque soy ansioso/a',
        ],
      },
      {
        question: '¿Qué género de películas prefieres para ver abrazados (cuando nos vemos)?',
        options: [
          'Terror o suspenso, para tener excusa y abrazarte fuerte',
          'Comedia romántica, para ponernos tiernos',
          'Acción o ciencia ficción, algo muy entretenido',
          'Una comedia tonta para reírnos a carcajadas',
        ],
      },
      {
        question: 'A la hora de elegir qué ver en Netflix/Prime:',
        options: [
          'Me gusta que tú decidas, casi siempre le achuntas',
          'Nos demoramos más eligiendo que viendo la película',
          'Me gusta imponer mi elección porque tengo buen gusto',
          'Tenemos una lista de pendientes súper organizada',
        ],
      },
      {
        question: 'Si comemos algo mientras vemos una película, tiene que ser:',
        options: [
          'Cabritas dulces o saladas, un clásico',
          'Algo chatarra contundente (pizza, sushi, hamburguesa)',
          'Cositas dulces (chocolates, gomitas, helado)',
          'Cualquier cosa sirve mientras estemos juntos',
        ],
      },
      {
        question: 'Cuando vemos una película, ¿cómo te comportas?',
        options: [
          'Comento todo lo que pasa en cada escena',
          'Veo todo en completo silencio y concentrado/a',
          'Me quedo dormido/a a la mitad de la película',
          'Me distraigo con el celular a cada rato',
        ],
      },
    ],
  },
  {
    theme: 'Citas con Presupuesto',
    subtitle: 'Panoramas de estudiantes y amores jóvenes',
    questions: [
      {
        question: 'Si andamos con poca plata este fin de semana, ¿cuál es la mejor cita?',
        options: [
          'Comprar algo para picar e ir a un parque a conversar',
          'Juntarnos en la casa de uno a cocinar algo simple',
          'Caminar por la ciudad y comer un heladito',
          'Maratón de juegos o series sin gastar un peso',
        ],
      },
      {
        question: 'A la hora de pagar cuando salimos:',
        options: [
          'Me gusta que vayamos a medias siempre (mitad y mitad)',
          'Prefiero que una vez invites tú y a la próxima yo',
          'A veces me gusta invitar yo todo para regalonearte',
          'Calculamos exactamente lo que comió cada uno',
        ],
      },
      {
        question: 'Si te quiero sorprender con un detalle barato pero lindo:',
        options: [
          'Una carta o algo hecho a mano por ti',
          'Que me pases a buscar de sorpresa',
          'Mi chocolate o dulce favorito',
          'Que me mandes una playlist hecha para mí',
        ],
      },
      {
        question: 'El mejor panorama de calle para nosotros es:',
        options: [
          'Ir a vitrinear ropa o cosas frikis sin comprar nada',
          'Subir un cerro o ir a la naturaleza',
          'Buscar algún evento gratis (ferias, tocatas, exposiciones)',
          'Ir a probar la comida callejera más barata y rica',
        ],
      },
      {
        question: '¿Qué opinas de las citas elegantes y caras?',
        options: [
          'Me encantan para fechas especiales como aniversarios',
          'Me incomodan un poco, prefiero lo casual',
          'Soñadas, ojalá cuando trabajemos vayamos seguido',
          'Me da igual el lugar, lo que importa es la compañía',
        ],
      },
    ],
  },
  {
    theme: 'Estudios y Apoyo Mutuo',
    subtitle: 'Sobreviviendo a la U o al trabajo juntos',
    questions: [
      {
        question: 'En época de exámenes o mucha carga, ¿cómo te puedo ayudar más?',
        options: [
          'Dándome ánimo por chat y entendiéndome si estoy distante',
          'Juntándonos a estudiar/trabajar en silencio acompañados',
          'Ayudándome a repasar o preguntándome la materia',
          'Llevándome algo rico de comer para sobrevivir',
        ],
      },
      {
        question: 'Si me saco una mala nota o tengo un mal día:',
        options: [
          'Necesito un abrazo largo y que me escuches quejarme',
          'Prefiero distraerme hablando de cualquier otra cosa',
          'Que me des consejos objetivos para mejorar',
          'Que nos riamos juntos de la desgracia',
        ],
      },
      {
        question: 'Cuando tú tienes éxito en algo importante (pasas el ramo, etc.):',
        options: [
          'Quiero celebrarlo saliendo a comer algo rico',
          'Me emociono más que tú y le cuento a todos',
          'Me basta con que me felicites y me digas que estás orgulloso/a',
          'Prefiero una celebración íntima y tranquila',
        ],
      },
      {
        question: '¿Qué te parece estudiar o hacer trabajos juntos?',
        options: [
          'Me encanta, me motiva verte concentrado/a',
          'Imposible, nos distraemos demasiado conversando',
          'Sirve si estamos cada uno en lo suyo con audífonos',
          'Solo sirve si estamos a distancia en videollamada',
        ],
      },
      {
        question: 'Nuestra principal meta a corto/mediano plazo es:',
        options: [
          'Terminar nuestras carreras/estudios exitosamente',
          'Ahorrar plata para hacer nuestro primer viaje juntos',
          'Tener más independencia para vernos más',
          'Conseguir estabilidad para pensar en vivir juntos',
        ],
      },
    ],
  },
  {
    theme: 'Fantasías a Futuro',
    subtitle: 'Soñando con cuando vivamos juntos',
    questions: [
      {
        question: 'Cuando al fin vivamos solos, ¿qué es lo primero que haremos?',
        options: [
          'Andar desnudos o en ropa interior por toda la casa',
          'Cocinar nuestra primera cena oficial en nuestro espacio',
          'Hacer una fiesta de inauguración con los amigos',
          'Dormir abrazados toda la noche sin que nadie moleste',
        ],
      },
      {
        question: '¿Qué regla sería inquebrantable en nuestra futura casa?',
        options: [
          'Nunca irnos a dormir enojados',
          'El que cocina, no lava los platos',
          'Tener un día a la semana sagrado para nosotros solos',
          'No revisar el celular mientras comemos juntos',
        ],
      },
      {
        question: '¿Cómo imaginas el estilo de nuestro futuro hogar?',
        options: [
          'Muy moderno, minimalista y ordenado',
          'Acogedor, lleno de plantitas, fotos y luces cálidas',
          'Medio friki/gamer, con nuestros hobbies por todos lados',
          'Un caos hermoso y funcional, lo que vaya saliendo',
        ],
      },
      {
        question: 'Sobre tener mascotas cuando vivamos juntos:',
        options: [
          '¡Sí o sí! Un perrito para salir a pasear',
          'Prefiero un gato (o varios), son más independientes',
          'Mejor algo chiquito (hámster, peces) para empezar',
          'Al principio mejor solos para adaptarnos nosotros',
        ],
      },
      {
        question: 'Si en el futuro trabajamos todo el día, nuestro momento especial será:',
        options: [
          'Tomar desayuno juntos antes de salir de la casa',
          'Llegar en la noche y contarnos el día en la cama',
          'Ver un capítulo de nuestra serie cenando',
          'El fin de semana, para no salir de la cama',
        ],
      },
    ],
  },
  {
    theme: 'Intimidad y Confianza',
    subtitle: 'Conectando físicamente en nuestros espacios',
    questions: [
      {
        question: 'Cuando logramos tener la casa sola, ¿qué es lo que más te prende?',
        options: [
          'El misterio de saber que tenemos poco tiempo',
          'Poner música y crear un ambiente relajado sin apuros',
          'Que tomes la iniciativa apenas cerramos la puerta',
          'Hacer las cosas normales (ver tele, cocinar) pero muy pegaditos',
        ],
      },
      {
        question: '¿Qué caricia te gusta más cuando estamos solos relajados?',
        options: [
          'Piojitos en la cabeza hasta quedarme dormido/a',
          'Masajes en la espalda o el cuello',
          'Que me acaricies la cara y me des besos cortos',
          'Que me hagas cariño en las manos o brazos',
        ],
      },
      {
        question: 'Si intentamos algo nuevo en la intimidad y sale chistoso o torpe:',
        options: [
          'Nos morimos de la risa y seguimos',
          'Me da un poco de vergüenza pero se me pasa rápido',
          'Paramos, nos reímos y volvemos a lo clásico',
          'Lo seguimos intentando hasta que salga bien',
        ],
      },
      {
        question: '¿Qué tipo de besos te vuelven loco/a?',
        options: [
          'Los besos lentos que van subiendo de intensidad',
          'Besos inesperados en el cuello o la mandíbula',
          'Los besos apasionados que te dejan sin aliento',
          'Besos tiernos de piquito todo el tiempo',
        ],
      },
      {
        question: 'Para ti, el preámbulo (los previos) ideal comienza con:',
        options: [
          'Mensajes coquetos horas antes de vernos',
          'Un buen beso prolongado cuando nos saludamos',
          'Miradas fijas e insinuaciones sutiles',
          "Abrazos fuertes y roces 'sin querer' a cada rato",
        ],
      },
    ],
  },
  {
    theme: 'Celos y Límites Sanos',
    subtitle: 'Construyendo confianza día a día',
    questions: [
      {
        question: 'Si alguien me está coqueteando muy descaradamente frente a ti:',
        options: [
          'Te agarro la mano y marco territorio sutilmente',
          'Me da risa porque sé que no me vas a pescar al otro/a',
          'Me enojo un poco y espero que tú lo/a cortes',
          'Me pongo a coquetearte yo el triple frente a esa persona',
        ],
      },
      {
        question: 'Respecto a las contraseñas del celular:',
        options: [
          'Nos las sabemos, tenemos confianza total',
          'No me las sé ni me interesan, respeto tu privacidad',
          'Te paso mi celu si necesitas buscar algo, sin problemas',
          'Creo que el celular es 100% personal e intocable',
        ],
      },
      {
        question: 'Si te sientes un poco inseguro/a o celoso/a por algo:',
        options: [
          'Te lo digo de frente para no pasarme rollos',
          'Me pongo un poco cortante hasta que me preguntas',
          'Lo proceso solo/a primero y después te comento',
          'Hago preguntas indirectas para tantear terreno',
        ],
      },
      {
        question: 'Lo que más seguridad me da en nuestra relación es:',
        options: [
          'Cómo me hablas y el tono que usas conmigo',
          'Que me incluyas en tus planes y me presentes a tu gente',
          'Que cumplas lo que prometes, la consistencia',
          'Tu transparencia y que me cuentes tus cosas',
        ],
      },
      {
        question: "Si un(a) ex tuyo/a te vuelve a hablar 'en buena':",
        options: [
          'Te cuento altiro para que no haya secretos',
          'No le respondo o corto la conversa rápido',
          'Le respondo cortés pero súper distante',
          'Depende de cómo hayamos terminado, pero te lo menciono',
        ],
      },
    ],
  },
  {
    theme: 'Resolución de Conflictos',
    subtitle: 'Cuando nos enojamos',
    questions: [
      {
        question: 'Cuando tenemos una discusión tonta por chat:',
        options: [
          'Prefiero llamarte por teléfono para arreglarlo rápido',
          'Te mando audios largos explicando mi punto',
          'Necesito dejar de responder un rato para calmarme',
          'Intento arreglarlo mandando un sticker tierno o chiste',
        ],
      },
      {
        question: 'Después de arreglar una pelea, ¿qué necesitas?',
        options: [
          'Un abrazo bien apretado y besos',
          'Cambiar de tema y actuar como si nada hubiera pasado',
          'Que nos digamos qué aprendimos de esto',
          'Comer algo rico juntos para pasar el mal rato',
        ],
      },
      {
        question: 'Mi peor defecto cuando discutimos es:',
        options: [
          'Me pongo muy terco/a y me cuesta dar el brazo a torcer',
          'Lloro de rabia o frustración fácilmente',
          'Saco cosas del pasado que nada que ver',
          'Me callo y me guardo las cosas para no pelear',
        ],
      },
      {
        question: 'Lo que más valoro de cómo resolvemos nuestros problemas es:',
        options: [
          'Que nunca nos faltamos el respeto',
          'Que sabemos pedir perdón cuando nos equivocamos',
          'Que no dejamos que el problema dure días',
          'Que siempre llegamos a un acuerdo justo',
        ],
      },
      {
        question: 'Si tú te equivocas en algo grande, la mejor forma de disculparte es:',
        options: [
          'Hablándolo de frente con honestidad brutal',
          'Mostrando con acciones que vas a cambiar',
          'Dándome un poco de tiempo y luego hablarme con cariño',
          'Con un pequeño detalle o regalo como ofrenda de paz',
        ],
      },
    ],
  },
  {
    theme: 'Gustos y Rarezas',
    subtitle: 'Las cosas que solo nosotros entendemos',
    questions: [
      {
        question: '¿Cuál es mi maña más rara que has descubierto?',
        options: [
          'Cómo como ciertos alimentos (ej: separar las cosas)',
          'Mis rituales antes de dormir',
          'Cómo reacciono cuando me asusto o sorprendo',
          'Palabras o sonidos raros que invento',
        ],
      },
      {
        question: 'Si pudieras eliminar una de mis prendas de ropa, ¿cuál sería?',
        options: [
          'Esa polera/pantalón viejísimo que no quieres botar',
          'Tus zapatos o zapatillas más feas',
          'Algo que usas para estar en casa que es anti-sexy',
          '¡Nada! Me encanta tu estilo así tal cual',
        ],
      },
      {
        question: 'Nuestra broma interna más chistosa es sobre:',
        options: [
          'Una palabra mal dicha que nos quedó pegada',
          'Algo vergonzoso que le pasó a uno de los dos',
          'Imitar a alguien que conocemos',
          'Un meme o video muy específico',
        ],
      },
      {
        question: 'Si fuéramos una caricatura o personajes, seríamos:',
        options: [
          'Homero y Marge (uno muy tonto y el otro lo apaña)',
          'Shrek y Fiona (un poco ogros pero amorosos)',
          'Batman y Robin (haciendo un gran equipo)',
          'Cosmo y Wanda (siempre metiéndonos en problemas)',
        ],
      },
      {
        question: '¿Qué costumbre mía se te ha pegado desde que estamos juntos?',
        options: [
          'Decir ciertas frases o palabras tuyas',
          'Comer algo que antes no me gustaba tanto',
          'Escuchar tu música o ver tus series',
          'Tu forma de reír o algún gesto con las manos',
        ],
      },
    ],
  },
  {
    theme: 'Familias y Amigos',
    subtitle: 'Nuestros mundos chocando',
    questions: [
      {
        question: 'Ir a comer a la casa de mis papás/familia te hace sentir:',
        options: [
          'Tranquilo/a, me caen súper bien',
          'Un poco nervioso/a todavía, quiero dar buena impresión',
          'Regaloneado/a, me dan mucha comida',
          'Silencioso/a, prefiero observar antes de hablar mucho',
        ],
      },
      {
        question: 'Cuando salimos con mis amigos, tú:',
        options: [
          'Te integras súper bien y eres el alma de la fiesta',
          'Te quedas más pegadito/a a mí, modo bajo perfil',
          'Aprovechas de hacerme bullying amigable con ellos',
          'Te llevas bien con un par, pero no con todos',
        ],
      },
      {
        question: 'Si tuviéramos que elegir a los padrinos de un futuro hijo (hipotético):',
        options: [
          'Tu mejor amigo/a y mi mejor amigo/a',
          'Nuestros hermanos (si tenemos)',
          'Alguien de nuestras familias',
          'Aún es muy pronto para pensar en eso',
        ],
      },
      {
        question: 'Lo que más me gusta de tus amigos es:',
        options: [
          'Cómo te apoyan y te cuidan',
          'Que son muy divertidos y relajados',
          'Que me aceptaron súper rápido en el grupo',
          'Que siempre tienen buenos planes o casas para juntarse',
        ],
      },
      {
        question: 'Cuando tenemos un cumpleaños familiar ineludible un sábado en la tarde:',
        options: [
          'Vamos juntos y aperramos como equipo',
          'Tratamos de ir un ratito no más y escaparnos',
          'Nos separamos y cada uno va a sus compromisos',
          'Nos quedamos pegados a la comida para que pase rápido',
        ],
      },
    ],
  },
  {
    theme: 'Fantasías de Viajes',
    subtitle: 'A dónde iremos cuando tengamos plata',
    questions: [
      {
        question: 'Nuestro primer viaje juntos dentro del país debería ser a:',
        options: [
          'La playa, para tomar sol y comer mariscos',
          'El sur, a una cabaña con estufa a leña y bosque',
          'El norte, a ver el desierto y las estrellas',
          'Donde sea más barato, la cosa es viajar',
        ],
      },
      {
        question: 'Si nos ganáramos un viaje todo pagado por 1 mes, ¿a dónde iríamos?',
        options: [
          'Europa, recorriendo muchas ciudades en tren',
          'Sudeste Asiático (Tailandia, Bali), playas y cultura',
          'Norteamérica (Disney, Nueva York, etc.)',
          'Caribe, puro resort y pulserita todo incluido',
        ],
      },
      {
        question: 'Como compañero/a de viaje, yo soy de los que:',
        options: [
          'Armo un excel con todo planificado minuto a minuto',
          'Fluyo y decido en el momento qué hacer',
          'Me preocupo de sacar las mejores fotos',
          'Solo quiero probar toda la comida local',
        ],
      },
      {
        question: 'En un viaje en bus/avión largo, nosotros estaríamos:',
        options: [
          'Yo durmiendo encima tuyo todo el camino',
          'Escuchando música con un audífono cada uno',
          'Comiendo puros snacks y conversando',
          'Viendo películas descargadas en el celu',
        ],
      },
      {
        question: 'El mayor desafío de viajar juntos sería:',
        options: [
          'Ponernos de acuerdo en qué lugares visitar',
          'El desorden o mañas al compartir una habitación pequeña',
          'El cansancio que nos ponga de mal humor',
          'Ajustarnos al presupuesto sin pelear',
        ],
      },
    ],
  },
  {
    theme: 'Nuestra Primera Vez...',
    subtitle: 'Recordando los hitos',
    questions: [
      {
        question: '¿Qué recuerdas de nuestro primer beso?',
        options: [
          'Fue perfecto, de película',
          'Estábamos re nerviosos y fue medio torpe pero lindo',
          'Fue inesperado, me tomaste por sorpresa',
          'Nos costó caleta dar el paso, andábamos rodeando',
        ],
      },
      {
        question: 'La primera vez que me viste, ¿qué pensaste?',
        options: [
          "'Qué atractivo/a es, tengo que acercarme'",
          "'Se ve simpático/a, pero no pensé que llegaríamos a esto'",
          "'Qué persona tan rara/intimidante'",
          "'Me cayó pésimo al principio'",
        ],
      },
      {
        question: 'Nuestra primera cita oficial fue:',
        options: [
          'Muy romántica y planeada',
          'Súper casual, casi como amigos al principio',
          'Llena de silencios incómodos y nervios',
          'Muy divertida, no paramos de hablar',
        ],
      },
      {
        question: 'El momento exacto en que me di cuenta que me gustabas en serio fue:',
        options: [
          'Cuando nos reímos de la misma tontera',
          'Cuando me cuidaste o te preocupaste por mí un día',
          'Después de un beso o momento muy íntimo',
          'Fue de a poco, no hubo un solo momento',
        ],
      },
      {
        question: "La primera vez que dijimos 'Te amo' (o lo demostramos fuerte):",
        options: [
          'Se me escapó sin querer',
          'Lo planeé y estaba muy nervioso/a',
          'Fue en un momento súper íntimo y sincero',
          'Aún nos cuesta decirlo, lo demostramos con acciones',
        ],
      },
    ],
  },
  {
    theme: 'Especial Invierno',
    subtitle: 'Días fríos, amor cálido',
    season: 'winter',
    questions: [
      {
        question: 'El mejor antojo de invierno para comer acurrucados es:',
        options: [
          'Sopaipillas pasadas o picarones',
          'Chocolatito caliente con malvaviscos',
          'Té o café con pancito recién tostado',
          'Algo chatarra pesado (pizza, papas fritas)',
        ],
      },
      {
        question: 'Cuando llueve muy fuerte y estamos en la casa de uno:',
        options: [
          'Nos tiramos a la cama a ver películas bajo mil plumones',
          'Nos ponemos nostálgicos y conversamos horas',
          'Nos ponemos modo regaloneo intenso/hot',
          'Tratamos de cocinar algo rico para matar el tiempo',
        ],
      },
      {
        question: 'Al dormir en invierno, nosotros:',
        options: [
          'Cucharita obligatoria para no morir de frío',
          'Yo te robo las frazadas a mitad de la noche',
          'Me pongo los calcetines más feos y gruesos',
          'Te pongo mis pies helados encima para molestarte',
        ],
      },
      {
        question: 'Si salimos un día de mucho frío, lo ideal es:',
        options: [
          'Ir a un café bonito y cerrado',
          'Ir al cine, siempre está calentito',
          'Caminar rápido y muy abrazados con bufandas',
          'Mejor no salimos, nos devolvemos a la casa',
        ],
      },
      {
        question: '¿Qué prenda de invierno te gusta más cómo me queda?',
        options: [
          "Los chalecos grandotes u 'oversize'",
          'Los gorritos de lana (beanies)',
          'Un buen abrigo o chaqueta de cuero',
          'Pijama de polar o enterito chistoso',
        ],
      },
    ],
  },
  {
    theme: 'Especial Verano',
    subtitle: 'Calor, vacaciones y amor',
    season: 'summer',
    questions: [
      {
        question: 'En una tarde de mucho calor, el panorama ideal es:',
        options: [
          'Conseguir una piscina sí o sí',
          'Ir a tomar helado o algún trago muy frío',
          'Quedarnos con el ventilador en la cara sin hacer nada',
          'Ir al parque a la sombra de los árboles',
        ],
      },
      {
        question: 'Sobre la ropa de verano, a mí me gusta verte con:',
        options: [
          'Traje de baño / bikini',
          'Ropa muy ligera y fresca, shorts o falditas',
          'Camisas abiertas o poleras sin mangas',
          'Lentes de sol y jockey, modo veraniego',
        ],
      },
      {
        question: 'Para dormir en las noches de 30 grados:',
        options: [
          'Cero contacto, si me tocas transpiramos',
          'Dormimos casi sin ropa y con todo abierto',
          'Abrazados igual, no me importa el sudor',
          'Nos peleamos por quién se pone al lado del ventilador',
        ],
      },
      {
        question: 'Si nos escapamos un fin de semana a la playa por el día:',
        options: [
          'Llevo quitasol, bloqueador y comida (modo mamá/papá)',
          'Solo llevamos toalla y compramos allá',
          'Me meto al agua aunque esté congelada',
          'Nos sacamos mil fotos en la arena al atardecer',
        ],
      },
      {
        question: 'La mejor bebida de verano para compartir es:',
        options: [
          'Un mote con huesillo bien helado',
          'Cerveza o algún trago refrescante (mojito, ramazzotti)',
          'Jugo natural de fruta (melón, sandía)',
          'Helado de agua para la sed',
        ],
      },
    ],
  },
  {
    theme: 'Mascotas y Perrhijos',
    subtitle: 'Nuestra futura (o actual) familia de cuatro patas',
    questions: [
      {
        question: 'Si tuviéramos que adoptar una mascota mañana mismo, ¿qué elegirías?',
        options: [
          'Un perrito rescatado, para sacarlo a pasear siempre',
          'Un gatito, son más independientes y limpios',
          'Algo exótico o diferente (hurón, conejo, erizo)',
          'Aún no estoy listo/a para esa responsabilidad',
        ],
      },
      {
        question: 'Sobre dejar que las mascotas duerman en la cama con nosotros:',
        options: [
          '¡Obvio! Que duerman entre medio de los dos',
          'A los pies de la cama me parece bien',
          'Depende de si están limpios, pero prefiero su propia camita',
          'Jamás, la cama es sagrada y libre de pelos',
        ],
      },
      {
        question: "¿Cuál de los dos sería el más 'malcriador' con la mascota?",
        options: [
          'Yo, le daría comida a escondidas de la mesa',
          'Tú, lo dejarías hacer lo que quiera',
          'Ambos seríamos un desastre poniéndole límites',
          'Ninguno, seríamos dueños súper estrictos',
        ],
      },
      {
        question: 'Si a la mascota no le gusta uno de nosotros al principio:',
        options: [
          'Me daría un poco de pena/celos',
          'Lo intentaría sobornar con premios y comida',
          'Le daría su espacio hasta que se acostumbre',
          'Me daría lo mismo, eventualmente cederá',
        ],
      },
      {
        question: '¿Qué nombre le pondríamos a una futura mascota juntos?',
        options: [
          'Un nombre de comida (Sushi, Taco, Choripan)',
          'Un nombre de persona humana seria (Roberto, Juan)',
          'Un nombre friki (de un anime, serie o juego)',
          'Un nombre tierno y clásico (Pelusa, Toby)',
        ],
      },
    ],
  },
  {
    theme: 'Nuestra Música y Conciertos',
    subtitle: 'El soundtrack de nuestra relación',
    questions: [
      {
        question: 'Si nos vamos de viaje largo en auto/bus, ¿qué escuchamos?',
        options: [
          'Ponemos mi playlist porque tengo mejor gusto',
          'Ponemos tu playlist para que vayas contento/a',
          'Un podcast o programa para ir conversando',
          'Una playlist mitad y mitad para ser justos',
        ],
      },
      {
        question: 'Nuestra canción (esa que nos dedicamos o nos recuerda al otro) nos hace sentir:',
        options: [
          'Piel de gallina y nostalgia de nuestros primeros días',
          'Ganas de cantarla a todo pulmón abrazados',
          'Ganas de bailarla ridículamente juntos',
          'Ternura, pero me da un poco de vergüenza admitirlo',
        ],
      },
      {
        question: 'Si uno de los dos canta pésimo en la ducha o el auto:',
        options: [
          'Me río y le hago coros peor aún',
          'Lo molesto pero en el fondo me encanta',
          'Me tapo los oídos en modo de broma',
          'Le digo sutilmente que no deje su trabajo de día',
        ],
      },
      {
        question: 'Sobre ir juntos a conciertos y festivales:',
        options: [
          'Me encanta, es de los mejores panoramas para gastar plata',
          'Acompaño si es tu artista favorito, pero no es mi onda',
          'Me agobia la multitud, prefiero verlos por YouTube',
          'Solo si podemos estar sentados y tranquilos',
        ],
      },
      {
        question: 'Si descubres que me gusta un artista que tú odias en secreto:',
        options: [
          'Te molesto por el resto de la eternidad',
          'Te pongo esa música para castigarte a veces',
          'Lo acepto en silencio porque te quiero',
          'Trato de convencerte con argumentos de por qué es malo',
        ],
      },
    ],
  },
  {
    theme: 'Juegos y Competencia',
    subtitle: 'Hobbies, consolas y cartas',
    questions: [
      {
        question: 'Si jugamos a algo competitivo (Mario Kart, Cartas, Ludo):',
        options: [
          'Soy un mal perdedor/a y me pico caleta',
          'Juego a ganar y te destruyo sin piedad',
          'Me da igual ganar, solo quiero reírme',
          'Te dejo ganar disimuladamente a veces',
        ],
      },
      {
        question: 'Cuando tú te quedas pegado/a jugando tu videojuego favorito:',
        options: [
          'Me quedo mirándote jugar y te hago compañía',
          'Aprovecho de hacer mis cosas o ver mi serie',
          'Te pido que me enseñes o me pases el control',
          'Me da un poco de lata si te ignoras mucho rato',
        ],
      },
      {
        question: 'El castigo ideal para el que pierde en un juego entre nosotros es:',
        options: [
          'Pagar la próxima comida o el próximo delivery',
          'Hacerle masajes al ganador por 15 minutos',
          'Cumplir un reto vergonzoso o penitencia',
          'Sacarse una prenda (si estamos solos y con ganas)',
        ],
      },
      {
        question: 'Si armamos un puzzle grande o un Lego de muchas piezas:',
        options: [
          'Seríamos un gran equipo trabajando ordenados',
          'Pelearíamos porque uno es más lento/desordenado',
          'Uno terminaría haciéndolo todo y el otro mirando',
          'Lo dejaríamos a la mitad por aburrimiento',
        ],
      },
      {
        question: '¿Qué opinas de los juegos de mesa para cuando nos juntamos?',
        options: [
          '¡Me encantan! Especialmente si invitamos amigos',
          'Solo me gustan si son rápidos y de mucha risa',
          'Me aburren rápido, prefiero conversar o ver algo',
          'Soy demasiado competitivo/a, mejor evitarlos por la paz',
        ],
      },
    ],
  },
  {
    theme: 'Apocalipsis y Humor',
    subtitle: 'Situaciones hipotéticas y divertidas',
    questions: [
      {
        question: 'Si hay un apocalipsis zombie mañana, nuestro plan es:',
        options: [
          'Tú te encargas de las armas, yo de las provisiones',
          'Robar un auto grande e irnos al sur o a la montaña',
          'Escondernos en el supermercado más cercano y atrincherarnos',
          'No duramos ni un día, nos muerden altiro',
        ],
      },
      {
        question: 'Si nos ganamos la lotería grande hoy mismo (1 millón de dólares):',
        options: [
          'No le decimos a nadie y desaparecemos de viaje',
          'Compramos una casa altiro para vivir juntos',
          'Pagamos todas nuestras deudas y seguimos estudiando/trabajando',
          'Lo derrochamos todo en comida y gustos en una semana',
        ],
      },
      {
        question: 'Si por un día pudieras leer mi mente, ¿qué descubrirías?',
        options: [
          'Que pienso en comida el 90% del tiempo',
          'Que soy mucho más ansioso/a de lo que parezco',
          'Que me paso rollos muy raros o chistosos todo el día',
          'Que pienso en ti más de lo que admito',
        ],
      },
      {
        question:
          'Si intercambiáramos cuerpos por un día como en las películas, lo primero que harías sería:',
        options: [
          'Manejarte el celular para leer todos tus chats',
          'Irme a mi casa a abrazar a mis propias mascotas/familia',
          'Hacer locuras con tu cuerpo para que pases vergüenza',
          'Experimentar cómo se siente la intimidad desde el otro lado',
        ],
      },
      {
        question: 'Si tuvieras que elegirme un superpoder, me darías:',
        options: [
          'Teletransportación, para vernos cuando queramos sin pagar pasaje',
          'Invisibilidad, para asustarme a cada rato',
          'Leer mentes, para que sepas qué quiero sin decir nada',
          'Poder comer sin engordar, seríamos felices',
        ],
      },
    ],
  },
  {
    theme: 'Regaloneos y Mimos',
    subtitle: 'El lenguaje del contacto físico',
    questions: [
      {
        question: 'Cuando estamos abrazados en el sillón o cama, tú eres:',
        options: [
          "El 'koala' que se pega y no me suelta por horas",
          'El que pide que le hagan cariñitos (piojitos/espalda)',
          'El que abraza un ratito y después necesita espacio',
          'El que se queda dormido a los 5 minutos',
        ],
      },
      {
        question: '¿En qué parte de mi cuerpo te gusta más que te acaricie?',
        options: [
          'La cabeza y el pelo (piojitos)',
          'La espalda (rasquitas suaves)',
          'El cuello y la nuca',
          'Los brazos o las manos',
        ],
      },
      {
        question: 'Si llegas muy estresado/a, el mejor mimo físico es:',
        options: [
          'Un masaje en los hombros y cuello',
          'Que me abraces por detrás y me des un beso en el cuello',
          'Acostarme en tu pecho un rato en silencio',
          'Tomarme las manos fuerte mirándome a los ojos',
        ],
      },
      {
        question: 'Caminar de la mano en la calle es:',
        options: [
          'Fundamental, me encanta que todos nos vean juntos',
          'Rico un rato, pero me transpiran las manos',
          'Prefiero ir abrazados de la cintura',
          'Normalmente vamos sueltos conversando, me da lo mismo',
        ],
      },
      {
        question: 'Cuando te doy un beso de sorpresa mientras estás distraído/a:',
        options: [
          'Me asusto un poco pero me saco una sonrisa boba',
          'Te lo devuelvo inmediatamente con más ganas',
          'Me sonrojo si estamos en público',
          'Depende de qué estaba haciendo, me puedo desconcentrar',
        ],
      },
    ],
  },
  {
    theme: 'Dinero y Ahorro',
    subtitle: 'Hablando de platas sin pelear',
    questions: [
      {
        question: 'Nuestra filosofía con la plata de la pareja es:',
        options: [
          'Cuentas claras conservan la relación (50/50 en casi todo)',
          'El que tiene más en el momento apaña al otro',
          'Invitamos por turnos, hoy tú, mañana yo',
          'Yo trato de pagar siempre que puedo para regalonearte',
        ],
      },
      {
        question: 'Si logramos juntar plata extra a fin de mes, deberíamos:',
        options: [
          'Meterla a un fondo común para nuestro futuro/casa',
          'Gastarla en una cita espectacular que nos merecemos',
          'Ahorrarla para nuestro próximo viaje',
          'Comprar algo material que nos sirva a ambos (tele, consola)',
        ],
      },
      {
        question: 'En cuanto al manejo del dinero, tú te consideras:',
        options: [
          'Una hormiguita ahorradora, cuido cada peso',
          'Muy gastador/a, me cuesta llegar a fin de mes',
          'Equilibrado/a, ahorro pero me doy mis gustos',
          'Desordenado/a, a veces no sé en qué se me fue la plata',
        ],
      },
      {
        question: "El gasto 'innecesario' en el que siempre caemos es:",
        options: [
          'Pedir delivery por flojera a cocinar',
          'Comprar cositas dulces o snacks',
          'Ir a tomar cafés caros o salir a bares',
          'Uber/Didi porque se nos hizo tarde o nos dio flojera',
        ],
      },
      {
        question: 'Si estuviéramos apretadísimos de plata un mes:',
        options: [
          'Igual busco formas baratas de tener citas románticas',
          'Nos encerramos y vemos tele todo el mes',
          'Me estreso un poco y me pongo de mal humor',
          'Hacemos un presupuesto estricto en Excel',
        ],
      },
    ],
  },
  {
    theme: 'Días Malos y Contención',
    subtitle: 'Cómo ser un refugio para el otro',
    questions: [
      {
        question: 'Si lloro frente a ti de frustración o pena, tú:',
        options: [
          'Me abrazas fuerte sin decir nada hasta que me calme',
          'Te desesperas un poco tratando de buscarme soluciones',
          'Tratas de hacerme reír para cambiar mi ánimo',
          'Me haces preguntas para que me desahogue hablando',
        ],
      },
      {
        question: "Cuando estoy enojado/a con el mundo y ando 'pesado/a':",
        options: [
          'Tienes paciencia y me das mi espacio',
          'Te enojas tú también de vuelta porque te frustra',
          'Me llevas la contra para intentar calmarme',
          'Me traes comida o algo dulce para amansarme',
        ],
      },
      {
        question: 'La mejor frase que me puedes decir cuando me siento derrotado/a es:',
        options: [
          "'Estoy aquí contigo, no estás solo/a'",
          "'Tú puedes con todo esto, eres sequísimo/a'",
          "'Vamos a descansar, mañana será otro día'",
          "'¿A quién hay que pegarle?' (humor)",
        ],
      },
      {
        question: 'Si uno de los dos se enferma feo (gripe, fiebre, etc.):',
        options: [
          'Pido que me dejen solo/a para no contagiar a nadie',
          'Me pongo modo guagua y quiero que me cuides todo el día',
          'Soy pésimo/a enfermo/a, me pongo mañoso/a',
          'Intento seguir funcionando igual como si nada',
        ],
      },
      {
        question: 'Lo que más me calma de ti en medio de mi ansiedad es:',
        options: [
          'El tono de tu voz, muy suave y tranquilo',
          'Tus abrazos que me hacen sentir protegido/a',
          'Tu forma lógica de ver los problemas, me aterrizas',
          'Que simplemente te acuestes a mi lado',
        ],
      },
    ],
  },
  {
    theme: 'Tiempo a Solas vs Juntos',
    subtitle: 'Equilibrando el amor y la individualidad',
    questions: [
      {
        question: 'Para ti, tener un día entero sin vernos ni hablarnos mucho:',
        options: [
          'Es necesario a veces para extrañarnos y recargar pilas',
          'Me genera un poco de ansiedad, prefiero hablarte',
          'Lo aprovecho al máximo haciendo mis cosas',
          'Me aburro, siento que el día está incompleto',
        ],
      },
      {
        question: 'Cuando estás haciendo tus hobbies a solas (jugar, leer, entrenar):',
        options: [
          'Me encanta que igual me mandes un mensajito entre medio',
          'Prefiero desconectarme del celular por completo',
          'Me gusta que me preguntes por lo que estoy haciendo',
          'Quiero que respetes ese espacio 100% sin interrupciones',
        ],
      },
      {
        question: 'Si salgo solo/a con mis amigos toda la noche, tú:',
        options: [
          'Estás feliz de que lo pase bien, duermes tranquilo/a',
          "Te quedas esperando un 'llegué bien' antes de dormir",
          'Aprovechas de armar panorama por tu cuenta',
          'Me extrañas y andas pendiente del celu',
        ],
      },
      {
        question: 'En una relación sana, los intereses de ambos:',
        options: [
          'Tienen que tener muchas cosas en común',
          'Es mejor que sean distintos para no aburrirse',
          'Hay que intentar que nos gusten las cosas del otro',
          'No importan mientras se respete el espacio del otro',
        ],
      },
      {
        question: 'Si llevamos muchos días viéndonos de corrido, yo:',
        options: [
          'Sigo queriendo verte igual al día siguiente',
          'Empiezo a necesitar un día en mi cueva',
          'Me pongo un poco más irritable sin querer',
          'Propongo hacer algo totalmente distinto para no rutinizarnos',
        ],
      },
    ],
  },
  {
    theme: 'Redes Sociales y Mundo Digital',
    subtitle: 'Likes, historias y privacidad',
    questions: [
      {
        question: 'Publicar fotos juntos en Instagram/TikTok para mí es:',
        options: [
          'Bacán, me gusta mostrarte con orgullo al mundo',
          'Para ocasiones especiales nomás (cumpleaños, viajes)',
          'Muy poco, prefiero que nuestra relación sea privada',
          'Solo subiría fotos tontas o memes contigo',
        ],
      },
      {
        question: 'Si subes una foto tuya donde sales increíble (sexy/guapo/a):',
        options: [
          'Soy el primero en comentar algo fogoso o babear',
          'Me da un poquitito de celos pero te doy like orgulloso/a',
          'Prefiero que me las mandes a mí en privado',
          'Te comento alguna tontera para molestarte',
        ],
      },
      {
        question: 'Revisar los seguidores o a quién sigue tu pareja:',
        options: [
          'Es de tóxico/a, yo no lo hago ni me importa',
          'Lo he hecho un par de veces de puro sapo/a',
          'Si me da desconfianza alguien, me fijo',
          'No tengo tiempo ni ganas para andar haciendo eso',
        ],
      },
      {
        question: 'Si alguien te responde una historia coqueteándote de frentón:',
        options: [
          'Lo ignoras olímpicamente',
          'Le respondes muy seco o le pones un límite claro',
          'Me cuentas riéndote y lo bloqueamos juntos',
          'Le respondes con una foto donde salimos los dos',
        ],
      },
      {
        question: 'Tu opinión sobre tener las contraseñas del otro es:',
        options: [
          'Una falta de confianza y privacidad tremenda',
          'Normal si se da la situación de necesitar el celu',
          'Un voto de confianza total, las tenemos',
          'Me da lo mismo, no tengo nada que esconder',
        ],
      },
    ],
  },
  {
    theme: 'Manejo del Estrés',
    subtitle: 'Sobreviviendo la presión juntos',
    questions: [
      {
        question: 'Cuando estás muy estresado/a, tu forma de actuar cambia a:',
        options: [
          'Me aíslo y me vuelvo más callado/a',
          'Me pongo muy irritable y salto por cualquier cosa',
          'Empiezo a limpiar y ordenar todo compulsivamente',
          'Como mucho más o puro azúcar por ansiedad',
        ],
      },
      {
        question: 'Si los dos estamos pasando por una semana terrible al mismo tiempo:',
        options: [
          'Chocamos y discutimos más fácilmente',
          'Nos unimos más y somos un equipo de supervivencia',
          'Nos vemos menos para no traspasarnos mala onda',
          'Lloramos juntos comiendo chatarra',
        ],
      },
      {
        question: "¿Cuál es tu forma de 'botar' estrés que yo más noto?",
        options: [
          'Ponerte a jugar videojuegos por horas',
          'Dormir siestas muy largas',
          'Quejarte y hablar mucho rápido',
          'Hacer ejercicio o salir a caminar',
        ],
      },
      {
        question: 'Si me ves colapsado/a por algo de trabajo/estudios que no me sale:',
        options: [
          'Me ofreces ayuda práctica (revisar texto, hacer un esquema)',
          'Me obligas a cerrar el computador un rato y descansar',
          'Me traes un café o tecito sin que te lo pida',
          'Me dices frases motivadoras para no rendirme',
        ],
      },
      {
        question: 'El mejor escape de fin de semana para bajar el estrés sería:',
        options: [
          'Literalmente no salir de la cama todo el fin de semana',
          'Irnos a la naturaleza a respirar aire puro',
          'Ir a un lugar donde haya buena comida y copetes',
          'Hacer algo extremo o diferente (parque de diversiones, subir un cerro pesado)',
        ],
      },
    ],
  },
  {
    theme: 'Metas a Corto Plazo',
    subtitle: 'Nuestros próximos hitos',
    questions: [
      {
        question: 'De aquí a un año, el hito más importante para nuestra relación sería:',
        options: [
          'Haber hecho nuestro primer viaje importante juntos',
          'Conseguir trabajos estables para pensar en independizarnos',
          'Conocernos aún mejor y mantener esta chispa',
          'Aprender a manejar mejor nuestras diferencias/peleas',
        ],
      },
      {
        question: 'Si tuviéramos que elegir una meta económica de a dos para este año:',
        options: [
          'Ahorrar X monto para un pasaje o escapada',
          'No endeudarnos más en salidas a comer',
          'Juntar plata para comprar un auto a medias',
          'Comprar pasajes para ir a ver a nuestro artista favorito',
        ],
      },
      {
        question: 'Una habilidad o hobby que me gustaría que aprendiéramos juntos es:',
        options: [
          'Aprender a cocinar platos ricos (y no pura chatarra)',
          'Aprender algún baile juntos (salsa, bachata)',
          'Aprender un idioma o hacer un curso online',
          'Meterle más al deporte o gimnasio como pareja',
        ],
      },
      {
        question: 'El próximo gran paso en nuestra confianza íntima debería ser:',
        options: [
          'Hablar aún más abiertamente de nuestras fantasías',
          'Romper la vergüenza con cosas del cuerpo/baño',
          "Tener un 'finde solos' sin interrupciones familiares",
          'Animarnos a intentar cosas nuevas sin tabúes',
        ],
      },
      {
        question: 'Lo que más me entusiasma de nuestro futuro cercano es:',
        options: [
          'Terminar esta etapa de estudios/junior y tener más tiempo',
          'La posibilidad de tener por fin nuestro propio espacio',
          'Todas las tonteras que nos quedan por reírnos',
          'Ver cómo creces en lo personal y apoyarte',
        ],
      },
    ],
  },
  {
    theme: 'Fantasías de Independencia',
    subtitle: 'Saliendo del nido',
    questions: [
      {
        question: 'Cuando por fin nos independicemos, el mayor miedo será:',
        options: [
          'No saber cómo llegar a fin de mes y pagar las cuentas',
          'Tener que cocinar y limpiar todos los malditos días',
          "Que el convivir tanto tiempo arruine la 'magia'",
          'Extrañar las comodidades de nuestras familias',
        ],
      },
      {
        question: 'Nuestro primer mueble comprado en conjunto será:',
        options: [
          'Una cama gigante y cómoda, es lo principal',
          'Un sillón ultra cómodo para ver series',
          'Una mesa grande para jugar juegos o invitar amigos',
          'Una tele 4K gigante',
        ],
      },
      {
        question: 'Al decorar nuestra primera casa, la temática será:',
        options: [
          'Full plantas por todos lados (jungla urbana)',
          'Modo friki: repisas con coleccionables y consolas',
          'Minimalista: todo blanco, madera y ordenado',
          'Lo que nos regalen nuestras mamás y tías, modo sobrevivencia',
        ],
      },
      {
        question: 'Si tenemos un fin de semana entero solos en nuestro nuevo depto:',
        options: [
          'Pasamos casi todo el tiempo en pelota',
          'Invitamos a los amigos a un asado o carrete altiro',
          'Nos dedicamos a armar muebles y limpiar profundamente',
          'Dormimos hasta las 2pm y pedimos pizza',
        ],
      },
      {
        question: '¿Quién será el encargado principal de la cocina?',
        options: [
          'Tú, porque cocinas mucho más rico',
          'Yo, porque tengo más ideas y me gusta',
          'Nos turnamos estrictamente un día y un día',
          'El delivery será nuestro mejor amigo',
        ],
      },
    ],
  },
  {
    theme: 'Especial Otoño',
    subtitle: 'Días frescos, amor cálido',
    season: 'autumn',
    questions: [
      {
        question: 'Con los días más frescos de otoño, ¿qué panorama te gusta más?',
        options: [
          'Caminar pisando hojas secas en el parque abrazados',
          'Ir a una cafetería rica a tomar chocolate caliente',
          'Acostarnos más temprano a ver series porque se oscurece',
          'Comprar cositas dulces para la hora del té juntos',
        ],
      },
      {
        question: 'El mejor postre para compartir en un domingo nublado de otoño es:',
        options: [
          'Unos picarones pasados o sopaipillas',
          'Pie de limón o Kuchen de manzana',
          'Un brownie con helado',
          'Waffles o panqueques con manjar preparados en casa',
        ],
      },
      {
        question: 'Sobre la ropa de media estación (otoño), me encanta verte con:',
        options: [
          'Gorritos (beanies) y bufandas ligeras',
          'Chaquetas de mezclilla o cuero',
          'Polar suavecito para abrazarte',
          'Chalecos delgados o cardigans tiernos',
        ],
      },
      {
        question: 'En las tardes frías, el preámbulo perfecto es:',
        options: [
          'Hacer cucharita un buen rato hasta entrar en calor',
          'Besos sorpresa mientras cocinamos o preparamos el té',
          'Empezar a sacarnos los chalecos lentamente',
          'Darnos una ducha calentita juntos',
        ],
      },
      {
        question: 'Si nos pilla un chaparrón sorpresa en la calle en otoño:',
        options: [
          'Corremos desesperados a buscar un techo riéndonos',
          'Te paso mi chaqueta para que no te mojes',
          'Caminamos lento y nos damos un beso bajo la lluvia (románticos)',
          'Me enojo un poco porque se me ensucian los zapatos/ropa',
        ],
      },
    ],
  },
  {
    theme: 'Especial Primavera',
    subtitle: 'Flores, solcito y alergias',
    season: 'spring',
    questions: [
      {
        question: 'En los días lindos de primavera, el mejor plan es:',
        options: [
          'Un picnic en un parque tirados en una manta',
          'Ir a un cerro o trekking ligero',
          'Tomar algo en una terraza de bar al atardecer',
          'Comprar un helado rico y caminar por la ciudad',
        ],
      },
      {
        question: 'Si quieres regalarme algo en esta época, me encantaría:',
        options: [
          'Flores reales o una plantita bonita',
          'Un desayuno sorpresa en mi casa',
          'Organizar una cita al aire libre',
          'Algo dulce como bombones o alfajores',
        ],
      },
      {
        question: 'Con la primavera llegan las alergias. Si ando modo zombie estornudando:',
        options: [
          'Me traes pañuelos y pastillas y me regaloneas',
          'Te ríes un poco de mi cara de destruido/a',
          'No te acercas mucho porque me lleno de mocos',
          'Me obligas a encerrarnos para que no sufra con el polen',
        ],
      },
      {
        question: 'El cambio de clima pone a la gente más cariñosa. En esta época tú:',
        options: [
          "Andas más 'hot' y proactivo/a con la intimidad",
          'Andas más tierno/a, pidiendo más mimos y abrazos',
          'Te da energía para planear más salidas',
          'Estás igual que siempre, el clima te da lo mismo',
        ],
      },
      {
        question: "La primera 'escapada' primaveral ideal sería a:",
        options: [
          'El Cajón del Maipo o la montaña por el día',
          'Una escapada flash a la playa, aunque el agua esté helada',
          'Alojarnos en un glamping o domo romántico',
          'Alquilarnos un depto bonito con piscina en otra ciudad',
        ],
      },
    ],
  },
  {
    theme: 'Especial Navideño',
    subtitle: 'Pan de pascua y regalos',
    season: 'christmas',
    questions: [
      {
        question: '¿Qué tradición navideña es la que más te gusta hacer en pareja?',
        options: [
          'Elegir nuestro regalito con mucha dedicación (o hacerlo)',
          'Juntarnos a comer pan de pascua y tomar cola de mono solos',
          'Acompañarnos a comprar regalos a los malls llenos de gente',
          'Hacernos una promesa o propósito para el año que viene',
        ],
      },
      {
        question: 'A la hora de darte mi regalo de Navidad:',
        options: [
          'Prefiero dártelo a solas antes o después de la fiesta',
          'Me gusta que lo abras frente a toda mi familia',
          'Te dejo pistas para que lo encuentres modo juego',
          'Te lo doy a las 12 en punto como manda la tradición',
        ],
      },
      {
        question: 'Si estamos complicados de plata para Navidad:',
        options: [
          'Hacemos un pacto de no darnos regalo material este año',
          'Nos hacemos regalos hechos a mano (cartas, cupones)',
          'Gastamos lo poco que tenemos en una buena comida',
          'Yo igual me endeudo un poquito para darte un gusto',
        ],
      },
      {
        question: 'La mejor parte de pasar Año Nuevo juntos es:',
        options: [
          'El abrazo y el beso justo a las 12:00',
          'El carrete/fiesta con amigos hasta el amanecer',
          'Comer mucho en familia',
          'Hacer los ritos juntos (calzón amarillo, maletas)',
        ],
      },
      {
        question: '¿Cuál es tu postura frente al Pan de Pascua?',
        options: [
          '¡Con fruta confitada! Como debe ser',
          'Solo con nueces y almendras, odio la fruta confitada',
          'Sin nada, que sea un queque nomás',
          'Me carga el pan de pascua, prefiero otro postre',
        ],
      },
    ],
  },
  {
    theme: 'Comida y Cocina',
    subtitle: 'Nuestros gustos culinarios y aventuras en la cocina',
    questions: [
      {
        question: 'Si tuvieras que cocinarme algo para impresionarme, ¿qué harías?',
        options: [
          'Algo casero y sencillo, tipo pasta con salsa hecha por mí',
          'Pediría comida y diría que la hice yo (shh)',
          'Un postre hermoso tipo brownies o galletas',
          'Me la jugaría con algo difícil tipo sushi casero',
        ],
      },
      {
        question: 'Cuando pedimos comida juntos, ¿cómo decidimos qué pedir?',
        options: [
          "Yo siempre decido porque la otra persona dice 'lo que tú quieras'",
          'Nos demoramos media hora debatiendo y al final pedimos lo mismo de siempre',
          'Cada uno pide lo suyo y compartimos un poco',
          'Pedimos lo que esté en oferta o con cupón',
        ],
      },
      {
        question: '¿Cuál es tu snack favorito para ver peli juntos?',
        options: [
          'Cabritas/palomitas con harto mantequilla',
          'Papas fritas o nachos con salsa',
          'Chocolates o dulces variados',
          'Fruta picada o algo más sano',
        ],
      },
      {
        question: 'Si pudiéramos salir a comer a cualquier lugar del mundo, ¿a dónde irías?',
        options: [
          'A un puesto callejero de tacos en México',
          'A un restaurante italiano romántico con velas',
          'A probar ramen auténtico en Tokio',
          'A un lugar con vista al mar y mariscos frescos',
        ],
      },
      {
        question: '¿Qué opinas de que uno de los dos sea mañoso/a para comer?',
        options: [
          'Es tierno, me gusta respetar sus gustos',
          'Me frustra un poco, pero lo acepto con amor',
          'Le hago probar cosas nuevas hasta que le gusten',
          'Yo soy el/la mañoso/a, así que no puedo opinar',
        ],
      },
    ],
  },
  {
    theme: 'Lenguaje del Amor',
    subtitle: 'Cómo nos demostramos cariño el uno al otro',
    questions: [
      {
        question: '¿Cuál es tu forma favorita de recibir cariño?',
        options: [
          'Palabras bonitas y piropo sinceros',
          'Abrazos, besos y contacto físico',
          'Que me dediquen tiempo de calidad sin distracciones',
          'Detallitos o regalos inesperados (aunque sean chiquitos)',
        ],
      },
      {
        question: '¿Cómo te das cuenta de que tu pareja te quiere sin que te lo diga?',
        options: [
          'Cuando se acuerda de los detalles pequeños que le conté',
          'Cuando me busca para estar juntos sin razón especial',
          'Cuando me defiende frente a otros o me cuida',
          'Cuando se preocupa de preguntarme cómo estoy de verdad',
        ],
      },
      {
        question: '¿Qué te derrite más en la relación?',
        options: [
          'Un mensaje largo y profundo de la nada',
          'Que me abrace fuerte sin decir nada',
          'Que planee algo especial solo para nosotros',
          'Que me diga lo orgulloso/a que está de mí',
        ],
      },
      {
        question: 'Cuando tu pareja está triste, ¿qué haces instintivamente?',
        options: [
          'Lo/la abrazo y me quedo en silencio acompañándolo/a',
          'Intento hacerlo/a reír con alguna tontería',
          'Le pregunto qué pasó y lo escucho atentamente',
          'Le compro o preparo algo que sé que le gusta',
        ],
      },
      {
        question: '¿Qué frase simple te llena más el corazón?',
        options: [
          "'Estoy orgulloso/a de ti'",
          "'Extraño estar contigo'",
          "'Eres lo mejor que me ha pasado'",
          "'Gracias por ser como eres'",
        ],
      },
    ],
  },
  {
    theme: 'Ropa y Estilo',
    subtitle: 'Cómo nos vestimos y qué nos gusta del look del otro',
    questions: [
      {
        question: '¿Cuál es tu prenda favorita de tu pareja?',
        options: [
          'Su polera/poleron favorita que ya tiene olor a él/ella',
          'Cuando se arregla especial y se pone algo diferente',
          'La ropa deportiva o cómoda del día a día',
          'Cuando usa algo que le regalé',
        ],
      },
      {
        question: '¿Te gusta que tu pareja te robe la ropa?',
        options: [
          'Me encanta, se ve adorable con mi ropa',
          'Depende de cuál, algunas son sagradas',
          'Sí, pero después no me la devuelve nunca',
          'Me da igual, ni me doy cuenta',
        ],
      },
      {
        question: 'Cuando salimos juntos a algo especial, ¿cómo nos coordinamos la ropa?',
        options: [
          'Nos mandamos foto antes para ver si combinamos',
          'Cada uno se viste como quiera, no nos importa',
          'Uno siempre se viste más arreglado que el otro',
          'Nos vestimos parecido sin querer, ya nos leemos la mente',
        ],
      },
      {
        question: '¿Qué estilo de ropa te parece más atractivo en tu pareja?',
        options: [
          'Casual y cómodo, como si no se esforzara pero se ve increíble',
          'Arregladito/a, bien vestido/a con estilo',
          'Deportivo, tipo buzo o ropa de gym',
          'Pijama o ropa de casa, verlo/a relajado/a',
        ],
      },
      {
        question: '¿Qué opinas de la ropa de pareja (poleras iguales, etc.)?',
        options: [
          'Es adorable, lo haría al tiro',
          'Un poco cringe pero lo haría por ti',
          'Solo si es algo sutil, no tan obvio',
          'Jamás, eso no va conmigo',
        ],
      },
    ],
  },
  {
    theme: 'Recuerdos Juntos',
    subtitle: 'Los momentos que nos han marcado como pareja',
    questions: [
      {
        question: '¿Cuál ha sido tu momento favorito juntos hasta ahora?',
        options: [
          'El día que nos hicimos novios oficialmente',
          'Una salida o cita que fue especialmente linda',
          'Un momento random que nos dio un ataque de risa',
          "La primera vez que nos dijimos 'te quiero'",
        ],
      },
      {
        question: '¿Recuerdas qué fue lo primero que pensaste cuando me conociste?',
        options: [
          "'Qué lindo/a, me gustaría conocerlo/a mejor'",
          "'Se ve buena onda, me cae bien'",
          'No me acuerdo bien, fue natural y gradual',
          "'Nah, no es mi tipo' (y mira cómo terminamos jaja)",
        ],
      },
      {
        question: '¿Hay alguna anécdota vergonzosa nuestra que siempre te da risa?',
        options: [
          'Sí, y la cuento cada vez que puedo para molestarte',
          'Sí, pero me da vergüenza y no la cuento a nadie',
          'Tenemos tantas que no sabría cuál elegir',
          'La verdad no se me ocurre ninguna',
        ],
      },
      {
        question: 'Si pudieras revivir un día entero que pasamos juntos, ¿cuál sería?',
        options: [
          'Nuestra primera cita real',
          'Un día donde no paramos de reírnos',
          'Un día donde tuvimos una conversación muy profunda',
          'Cualquier día normal donde simplemente estuvimos juntos',
        ],
      },
      {
        question: '¿Qué recuerdo nuestro guardarías en una cápsula del tiempo?',
        options: [
          'Una foto juntos de nuestra etapa más feliz',
          'Un screenshot de una conversación especial',
          'Un objeto que nos recuerde algo importante',
          'Una carta escrita a mano el uno al otro',
        ],
      },
    ],
  },
  {
    theme: 'Miedos y Vulnerabilidades',
    subtitle: 'Lo que no siempre mostramos pero sentimos',
    questions: [
      {
        question: '¿Cuál es tu mayor miedo en una relación?',
        options: [
          'Que me dejen de querer con el tiempo',
          'Perder mi independencia o dejar de ser yo',
          'No ser suficiente para la otra persona',
          'Que la rutina mate la emoción que sentimos',
        ],
      },
      {
        question: '¿Te cuesta decirme cuando algo te molesta de la relación?',
        options: [
          'Sí, me lo guardo porque no quiero pelear',
          'Un poco, pero eventualmente lo digo',
          'No, soy bien directo/a con lo que siento',
          'Depende de qué tan grave sea el tema',
        ],
      },
      {
        question: '¿Alguna vez has tenido miedo de que terminemos?',
        options: [
          'Honestamente sí, en algún momento difícil',
          'No realmente, confío en lo que tenemos',
          'Solo cuando peleamos fuerte, pero se me pasa rápido',
          'Prefiero no pensar en eso porque me angustia',
        ],
      },
      {
        question: '¿Cómo te sientes cuando me ves llorar o pasarla mal?',
        options: [
          'Se me parte el corazón, haría lo que fuera por consolarte',
          'Me siento impotente porque no sé cómo ayudarte',
          'Me pongo fuerte por fuera pero por dentro me afecta mucho',
          'Intento buscar soluciones prácticas al problema',
        ],
      },
      {
        question: '¿Qué es lo más difícil de ser pareja joven?',
        options: [
          'No tener plata para hacer todo lo que queremos',
          'Depender de los horarios y permisos de la familia',
          'La presión social o las opiniones de los demás',
          'No tener un espacio propio para estar a solas',
        ],
      },
    ],
  },
  {
    theme: 'Humor y Risas',
    subtitle: 'Lo que nos hace reír y las bromas internas',
    questions: [
      {
        question: '¿Quién hace reír más al otro?',
        options: [
          'Yo, claramente soy el/la chistoso/a de la relación',
          'Tú, siempre me sacas carcajadas',
          'Los dos por igual, somos un dúo cómico',
          'Ninguno, somos más serios pero nos complementamos',
        ],
      },
      {
        question: '¿Cuál es nuestro chiste interno más sagrado?',
        options: [
          'Ese que nadie entiende excepto nosotros y nos morimos de risa',
          'Un apodo ridículo que nos pusimos',
          'Una frase que repetimos como loros sin razón',
          'Todavía no tenemos uno tan especial, pero vendrá',
        ],
      },
      {
        question: '¿Te gusta que te hagan bromas pesadas con amor?',
        options: [
          'Sí, me encanta el humor, aguanto todo',
          'Depende de la broma, algunas me hacen enojar de verdad',
          'Solo si después me compensan con mimos',
          'No me gustan las bromas pesadas, prefiero humor tierno',
        ],
      },
      {
        question: '¿Cuál es tu reacción cuando tu pareja se ríe incontrolablemente?',
        options: [
          'Me contagio y me río igual aunque no sepa de qué',
          'Me quedo mirándolo/a con cara de enamorado/a',
          'Le grabo un video porque se ve gracioso/a',
          'Le pido que me cuente qué es tan chistoso',
        ],
      },
      {
        question: 'Si tuviéramos un canal de YouTube juntos, ¿de qué sería?',
        options: [
          'Challenges y retos de pareja chistosos',
          'Vlogs de nuestra vida cotidiana y citas',
          'Reaccionando a cosas juntos',
          'Cocinando desastrosamente juntos',
        ],
      },
    ],
  },
  {
    theme: 'Planes de Fin de Semana',
    subtitle: 'Cómo aprovechamos nuestro tiempo libre juntos',
    questions: [
      {
        question: 'Un sábado perfecto juntos sería...',
        options: [
          'Quedarnos en cama hasta tarde y ver series todo el día',
          'Salir a caminar, tomar un café y explorar la ciudad',
          'Juntarnos con amigos para hacer algo entretenido',
          'Cocinar juntos algo rico y disfrutar de una tarde tranquila',
        ],
      },
      {
        question: 'Si tenemos todo el domingo libre sin planes, ¿qué hacemos?',
        options: [
          'Improvisamos algo sobre la marcha',
          'Cada uno hace sus cosas y nos juntamos en la tarde',
          'Nos quedamos juntos todo el día haciendo nada',
          'Salimos a algún lado nuevo que no conocemos',
        ],
      },
      {
        question: '¿Qué plan gratis de fin de semana disfrutas más?',
        options: [
          'Ir a un parque a sentarnos y conversar',
          'Caminar por algún barrio bonito sin rumbo',
          'Quedarnos en casa cocinando con lo que hay',
          'Hacer una maratón de pelis con mantas y snacks',
        ],
      },
      {
        question: '¿Prefieres que planifiquemos las salidas o improvisar?',
        options: [
          'Planificar, me gusta saber qué haremos',
          'Improvisar totalmente, lo mejor es lo espontáneo',
          'Un mix: tener una idea general pero ser flexibles',
          'Que tú planifiques y yo solo aparezco',
        ],
      },
      {
        question: 'Si llueve todo el fin de semana, ¿qué hacemos?',
        options: [
          'Maratón de serie nueva que queramos empezar',
          'Jugar juegos de mesa, cartas o videojuegos juntos',
          'Aprovechar de dormir siesta y acurrucarnos',
          'Cocinar algo elaborado como proyecto del día',
        ],
      },
    ],
  },
  {
    theme: 'Fotos y Selfies',
    subtitle: 'Nuestra relación a través de la cámara',
    questions: [
      {
        question: '¿Quién saca más fotos en la relación?',
        options: [
          'Yo, tengo el celular lleno de fotos tuyas',
          'Tú, siempre me estás sacando fotos sin permiso',
          'Los dos somos igual de fotográficos',
          'Ninguno, somos pésimos para sacar fotos juntos',
        ],
      },
      {
        question: '¿Cuántas fotos juntos tenemos en el celular más o menos?',
        options: [
          'Muchísimas, el carrete está lleno de nosotros',
          'Unas cuantas, las justas y necesarias',
          'Pocas, siempre se nos olvida sacar fotos',
          'Tenemos más screenshots de conversaciones que fotos',
        ],
      },
      {
        question: '¿Cuál es tu pose favorita para fotos juntos?',
        options: [
          'El clásico selfie con cara pegada',
          'Que alguien más nos saque la foto para que salga mejor',
          'Fotos espontáneas sin posar',
          'Poses chistosas o haciendo caras graciosas',
        ],
      },
      {
        question: '¿Publicarías una foto nuestra en redes sociales?',
        options: [
          'Sí, que todo el mundo sepa que somos pareja',
          'Solo en historias, no tanto en el feed permanente',
          'Prefiero que nuestra relación sea más privada',
          'Solo en fechas especiales como aniversario',
        ],
      },
      {
        question: '¿Qué harías si encuentras una foto mía fea en tu celular?',
        options: [
          'La guardo como tesoro y te la muestro para molestarte',
          'La borro para proteger tu dignidad',
          'La pongo de fondo de pantalla para reírme',
          'Se la mando a tus amigos sin piedad',
        ],
      },
    ],
  },
  {
    theme: 'Rutinas de Pareja',
    subtitle: 'Las costumbres que hemos creado juntos sin darnos cuenta',
    questions: [
      {
        question: '¿Tenemos alguna rutina diaria juntos que sea sagrada?',
        options: [
          'El mensaje de buenos días / buenas noches siempre',
          'Llamarnos o hablarnos a cierta hora del día',
          'Mandarnos memes o TikToks durante el día',
          'No tenemos rutinas fijas, somos más espontáneos',
        ],
      },
      {
        question: 'Si un día no nos hablamos en todo el día, ¿qué pasa?',
        options: [
          'Sería súper raro, nunca pasa',
          'Pasa de vez en cuando y está bien',
          'Uno de los dos se preocupa y escribe primero',
          'Nos extrañamos horriblemente',
        ],
      },
      {
        question: '¿Cuál de estas rutinas te gustaría que tuviéramos?',
        options: [
          'Una cita semanal aunque sea algo sencillo',
          'Cocinar juntos al menos una vez a la semana',
          'Hacer ejercicio o caminar juntos',
          'Tener una noche de juegos o pelis fija',
        ],
      },
      {
        question: '¿Quién es más de rutina y quién más de improvisación?',
        options: [
          'Yo soy de rutina, tú improvisas todo',
          'Tú eres de rutina, yo improviso todo',
          'Los dos somos de rutina, somos predecibles',
          'Los dos improvisamos, es un caos hermoso',
        ],
      },
      {
        question: '¿Qué es lo primero que haces cuando nos juntamos después de no vernos?',
        options: [
          'Te abrazo fuerte y no te suelto',
          'Te doy un beso largo',
          'Te miro y te digo algo lindo',
          'Te empiezo a contar todo lo que me pasó desde que no nos vimos',
        ],
      },
    ],
  },
  {
    theme: 'Sueños y Metas de Vida',
    subtitle: 'Lo que queremos lograr juntos y por separado',
    questions: [
      {
        question: '¿Cuál es tu sueño más grande en la vida?',
        options: [
          'Ser profesional exitoso/a en lo que me apasiona',
          'Viajar por el mundo y conocer muchas culturas',
          'Tener una familia hermosa y un hogar lleno de amor',
          'Tener libertad financiera para no preocuparme de plata',
        ],
      },
      {
        question: '¿Cuándo te imaginas viviendo juntos?',
        options: [
          'Apenas podamos, ojalá pronto',
          'Cuando los dos estemos estables económicamente',
          'Después de terminar los estudios',
          'No lo he pensado mucho todavía, estoy enfocado/a en el presente',
        ],
      },
      {
        question: '¿Te gustaría que trabajáramos en algo juntos algún día?',
        options: [
          'Sí, sería genial tener un negocio de pareja',
          'No, prefiero que cada uno tenga su espacio profesional',
          'Tal vez algo chico como hobby, no como trabajo principal',
          'Depende de qué sea, me lo pensaría',
        ],
      },
      {
        question: '¿Qué meta quieres lograr en los próximos 2 años?',
        options: [
          'Terminar o avanzar bien en mis estudios',
          'Ahorrar plata para algo importante',
          'Crecer como persona y trabajar en mí mismo/a',
          'Viajar juntos por primera vez',
        ],
      },
      {
        question: 'Si pudieras vivir en cualquier ciudad del mundo con tu pareja, ¿cuál sería?',
        options: [
          'Santiago pero en un depa lindo con terraza',
          'Barcelona, por la cultura y el mar',
          'Tokio, por la tecnología y la comida',
          'Algún pueblito tranquilo en el sur de Chile',
        ],
      },
    ],
  },
  {
    theme: 'Comunicación y Confianza',
    subtitle: 'Cómo nos contamos las cosas y lo que callamos',
    questions: [
      {
        question: '¿Sientes que puedes contarme absolutamente todo?',
        options: [
          'Sí, 100%. No tengo secretos contigo',
          'Casi todo, hay cosas que me cuesta más',
          'Sí, pero a veces me toma tiempo abrirme',
          'Prefiero guardarme algunas cosas para mí',
        ],
      },
      {
        question: '¿Cómo prefieres que te diga algo que me molestó?',
        options: [
          'Directo y al grano, sin vueltas',
          'Con cuidado y tacto, eligiendo bien las palabras',
          'Por mensaje primero para que lo proceses, después en persona',
          'En el momento, no me gusta que se guarden las cosas',
        ],
      },
      {
        question: '¿Revisarías el celular de tu pareja si tuvieras la oportunidad?',
        options: [
          'No, confío plenamente y respeto su privacidad',
          'La verdad me daría curiosidad pero no lo haría',
          'Si tuviera motivos para desconfiar, tal vez sí',
          'Ya lo hemos hecho los dos y no hay dramas',
        ],
      },
      {
        question: '¿Cómo reaccionas cuando tu pareja tiene un amigo/a cercano del otro sexo?',
        options: [
          'Me da igual, confío en mi pareja',
          'No me molesta pero me gusta conocer a esa persona',
          'Me genera un poquito de inseguridad pero lo manejo',
          'Prefiero no pensar en eso la verdad',
        ],
      },
      {
        question: "¿Qué tan importante es decir 'te amo' todos los días?",
        options: [
          'Fundamental, necesito escucharlo y decirlo a diario',
          'Importante, pero no tiene que ser todos los días',
          'Las acciones dicen más que las palabras',
          'Me gusta más cuando sale espontáneo y no por costumbre',
        ],
      },
    ],
  },
  {
    theme: 'Tradiciones Nuestras',
    subtitle: 'Las costumbres únicas que solo nosotros entendemos',
    questions: [
      {
        question: "¿Tenemos algún lugar que sea 'nuestro lugar' especial?",
        options: [
          'Sí, un lugar donde siempre volvemos porque nos trae recuerdos',
          'No uno fijo, pero hay varios que son especiales',
          'La verdad donde sea que estemos juntos es especial',
          'Todavía no, pero me gustaría que tuviéramos uno',
        ],
      },
      {
        question: "¿Cuál es 'nuestra canción'?",
        options: [
          'Tenemos una bien definida que los dos sabemos',
          'Tenemos varias que nos recuerdan momentos juntos',
          'No tenemos una oficial, pero hay canciones que me recuerdan a ti',
          "No somos mucho de tener 'nuestra canción'",
        ],
      },
      {
        question: '¿Celebramos los aniversarios mensuales (mesiversarios)?',
        options: [
          'Sí, cada mes sin falta, con algo especial',
          'Los primeros meses sí, después se nos fue olvidando',
          'Solo lo mencionamos por mensaje pero no hacemos nada',
          'No, esperamos los aniversarios grandes',
        ],
      },
      {
        question: '¿Qué tradición de pareja te gustaría que creáramos?',
        options: [
          'Escribirnos una carta para cada aniversario',
          'Tener un álbum de fotos que vayamos llenando',
          'Un viaje anual a algún lugar nuevo',
          'Una cena especial mensual donde nos arreglamos bonito',
        ],
      },
      {
        question: '¿Tenemos apodos secretos el uno para el otro?',
        options: [
          'Sí, y si alguien los escuchara se moriría de vergüenza ajena',
          'Usamos los clásicos: amor, bebé, mi vida',
          'Tenemos uno que inventamos nosotros y es único',
          'No somos mucho de apodos, nos llamamos por el nombre',
        ],
      },
    ],
  },
  {
    theme: 'Tecnología y Apps',
    subtitle: 'Cómo usamos la tecnología como pareja',
    questions: [
      {
        question: '¿Cuál es la app que más usamos para comunicarnos?',
        options: [
          'WhatsApp, el clásico de los clásicos',
          'Instagram por los DMs y las historias',
          'Coliflor obviamente, nuestra app privada 💛',
          'Llamadas telefónicas normales',
        ],
      },
      {
        question: '¿Te molesta que tu pareja pase mucho tiempo en el celular cuando están juntos?',
        options: [
          'Sí, cuando estamos juntos quiero atención',
          'Un poco, pero yo también lo hago',
          'No me molesta si no es todo el rato',
          'Literalmente los dos estamos pegados al celular juntos',
        ],
      },
      {
        question: '¿Compartirías tus contraseñas de redes con tu pareja?',
        options: [
          'Ya las compartimos, no tenemos nada que esconder',
          'Sí, si me las pide se las doy sin problema',
          'Prefiero que no, cada uno con su privacidad',
          'No he pensado en eso, nunca me las ha pedido',
        ],
      },
      {
        question: '¿Qué haces cuando tu pareja sube una foto y se ve increíble?',
        options: [
          'Le doy like y le comento algo lindo al tiro',
          'Le mando mensaje privado diciéndole lo hermoso/a que se ve',
          'Lo miro y me siento orgulloso/a pero no siempre comento',
          "Le saco screenshot y se lo mando diciendo 'te ves perfecto/a'",
        ],
      },
      {
        question: '¿Jugamos videojuegos juntos o alguno juega solo?',
        options: [
          'Jugamos juntos online y nos encanta',
          'Uno juega y el otro mira y opina',
          'Cada uno juega sus propios juegos',
          'Ninguno juega videojuegos realmente',
        ],
      },
    ],
  },
  {
    theme: 'Vida Universitaria',
    subtitle: 'Cómo equilibramos los estudios y el amor',
    questions: [
      {
        question: '¿Cómo manejan cuando uno tiene prueba y el otro quiere juntarse?',
        options: [
          'El que tiene prueba estudia y el otro entiende sin drama',
          'Estudiamos juntos (aunque sea una excusa para estar juntos)',
          'A veces cuesta, pero priorizamos los estudios',
          'Nos juntamos igual y después sufrimos con la nota',
        ],
      },
      {
        question: '¿Te gustaría que estudiáramos en el mismo lugar?',
        options: [
          'Sí, sería genial vernos todos los días',
          'No necesariamente, está bien tener nuestros propios espacios',
          'Me da un poco de miedo que sea mucho, pero sería lindo',
          'Ya estamos en el mismo lugar y me encanta',
        ],
      },
      {
        question: '¿Quién ayuda más al otro con los estudios?',
        options: [
          'Yo siempre lo/la ayudo a estudiar',
          'Él/ella me explica todo con paciencia',
          'Nos ayudamos mutuamente según la materia',
          'Cada uno se las arregla solo/a',
        ],
      },
      {
        question: '¿Cómo te sientes cuando tu pareja saca buena nota?',
        options: [
          'Súper orgulloso/a, lo celebro como si fuera mía',
          'Feliz pero también un poco celoso/a si a mí me fue mal',
          'Le digo que es un/a genio y le mando felicitaciones',
          'Normal, confío en que es inteligente y le va bien',
        ],
      },
      {
        question: 'Si tuviéramos que hacer un trabajo juntos para la u, ¿cómo sería?',
        options: [
          'Un desastre, terminaríamos peleando',
          'Seríamos el mejor equipo de todos',
          'Uno haría todo y el otro pondría el nombre nomás',
          'Nos costaría concentrarnos pero lo sacaríamos adelante',
        ],
      },
    ],
  },
  {
    theme: 'Aventuras Soñadas',
    subtitle: 'Todo lo que queremos hacer juntos algún día',
    questions: [
      {
        question: '¿Qué aventura loca harías conmigo si no tuviéramos límites?',
        options: [
          'Tirarnos en paracaídas o bungee jumping juntos',
          'Recorrer un país entero en auto o mochileando',
          'Nadar con delfines o bucear en un arrecife',
          'Acampar en la montaña bajo las estrellas',
        ],
      },
      {
        question: 'Si nos ganáramos un viaje sorpresa, ¿a dónde te gustaría ir?',
        options: [
          'A una playa paradisíaca con agua cristalina',
          'A una ciudad europea llena de historia y cultura',
          'A un destino aventurero como Nueva Zelanda',
          'A un lugar cerca pero especial, como el sur de Chile',
        ],
      },
      {
        question: '¿Cuál es la experiencia que más quieres vivir conmigo?',
        options: [
          'Nuestro primer viaje juntos, el que sea',
          'Vivir juntos por primera vez',
          'Ir a un concierto de nuestro artista favorito',
          'Conocer un lugar que siempre hemos soñado',
        ],
      },
      {
        question: 'Si pudiéramos tener un día perfecto sin preocupaciones, ¿cómo sería?',
        options: [
          'Playa, sol, helado y tú. Nada más',
          'Una aventura: montaña, trekking y fogata',
          'Un día de spa y relajo total juntos',
          'Recorrer una ciudad nueva probando comida en cada esquina',
        ],
      },
      {
        question: '¿Qué es lo primero que harías si pudiéramos mudarnos juntos mañana?',
        options: [
          'Cocinar juntos nuestra primera cena en casa',
          'Decorar todo el departamento a nuestro gusto',
          'Quedarnos en pijama todo el día sin que nadie nos moleste',
          'Invitar a los amigos a conocer nuestro nuevo hogar',
        ],
      },
    ],
  },
  {
    theme: 'Personalidades Opuestas',
    subtitle: 'En qué somos distintos y cómo nos complementamos',
    questions: [
      {
        question: '¿Quién es más madrugador/a y quién más trasnochador/a?',
        options: [
          'Yo madrugo, tú te quedas dormido/a hasta tarde',
          'Tú madrugas, yo soy búho nocturno',
          'Los dos somos trasnochadores, no conocemos el amanecer',
          'Los dos somos madrugadores, somos abuelos jóvenes',
        ],
      },
      {
        question: '¿Quién es más ordenado/a?',
        options: [
          'Yo, y a veces me desespera el desorden del otro',
          'Tú, yo soy un desastre pero con estilo',
          'Los dos somos igual de desordenados',
          'Los dos somos bastante ordenados',
        ],
      },
      {
        question: '¿Quién es más emocional y quién más racional?',
        options: [
          'Yo soy más emocional, tú eres más frío/a',
          'Tú eres más emocional, yo soy más cabeza fría',
          'Los dos somos súper emocionales y lloramos con todo',
          'Los dos somos bastante racionales',
        ],
      },
      {
        question: '¿Quién es más sociable y quién más introvertido/a?',
        options: [
          'Yo soy más sociable, tú prefieres estar tranquilo/a',
          'Tú eres más sociable, yo prefiero ambientes pequeños',
          'Los dos somos sociables y nos encanta salir',
          'Los dos somos introvertidos y nos entendemos perfecto',
        ],
      },
      {
        question: '¿Nuestras diferencias nos hacen más fuertes o nos complican?',
        options: [
          'Nos hacen más fuertes, nos complementamos perfecto',
          'A veces complican pero aprendemos del otro',
          'Depende del día y del tema',
          'Somos más parecidos de lo que la gente cree',
        ],
      },
    ],
  },
  {
    theme: 'El Futuro Cercano',
    subtitle: 'Lo que viene para nosotros en los próximos meses',
    questions: [
      {
        question: '¿Qué es lo que más te ilusiona de nuestro futuro próximo?',
        options: [
          'Nuestro próximo aniversario y cómo lo celebraremos',
          'Algún plan que tengamos pendiente juntos',
          'Simplemente seguir construyendo lo nuestro día a día',
          'La posibilidad de vivir nuevas experiencias juntos',
        ],
      },
      {
        question: '¿Qué meta de pareja quieres que logremos este año?',
        options: [
          'Fortalecer nuestra comunicación y confianza',
          'Tener una experiencia nueva juntos (viaje, concierto, etc.)',
          'Ahorrar para algo especial juntos',
          'Conocer mejor a las familias del otro',
        ],
      },
      {
        question: '¿Cómo te imaginas nuestra relación dentro de un año?',
        options: [
          'Más fuertes y enamorados que nunca',
          'Con más experiencias juntos y más unidos',
          'Ojalá viviendo juntos o con planes de hacerlo',
          'No me imagino tanto, prefiero vivir el presente',
        ],
      },
      {
        question: '¿Qué regalo te gustaría que te diera en nuestro próximo aniversario?',
        options: [
          'Una experiencia juntos: cena, paseo, o actividad',
          'Algo hecho a mano o personalizado con significado',
          'Un regalo material que sepa que quiero hace rato',
          'Tu tiempo y atención, es lo que más valoro',
        ],
      },
      {
        question: '¿Qué es lo que más valoras de lo que hemos construido juntos?',
        options: [
          'La confianza y honestidad que nos tenemos',
          'Las risas y los buenos momentos que hemos vivido',
          'El apoyo incondicional en los momentos difíciles',
          'El amor genuino que se siente cada día',
        ],
      },
    ],
  },
  {
    theme: 'Música y Conciertos',
    subtitle: 'Lo que escuchamos y lo que soñamos ver en vivo',
    questions: [
      {
        question: '¿Qué tipo de música escuchamos más cuando estamos juntos?',
        options: [
          'Reggaetón o urbano para perrear juntos',
          'Pop o indie que nos gusta a los dos',
          'Baladas románticas que nos ponen cursis',
          'Un mix de todo, nuestros gustos son muy diferentes',
        ],
      },
      {
        question: '¿A qué artista te morirías por ver en vivo conmigo?',
        options: [
          'Bad Bunny, para cantar y bailar como locos',
          'Taylor Swift, para llorar y gritar cada canción',
          'Coldplay, para vivir un espectáculo de luces épico',
          'Otro artista que amamos los dos',
        ],
      },
      {
        question: '¿Le dedicas canciones a tu pareja?',
        options: [
          'Sí, todo el tiempo le mando canciones con significado',
          'A veces, cuando encuentro una que me recuerda a él/ella',
          'No explícitamente, pero hay canciones que escucho pensando en él/ella',
          'No soy mucho de dedicar canciones pero las disfruto',
        ],
      },
      {
        question: '¿Cantamos juntos en el auto o en la casa?',
        options: [
          'Sí, y lo hacemos terrible pero con todo el corazón',
          'Uno canta y el otro se muere de vergüenza ajena',
          'Cantamos bajito cada uno en su mundo',
          'No cantamos, somos más de puro escuchar',
        ],
      },
      {
        question: '¿Qué canción bailarías conmigo en nuestra boda algún día?',
        options: [
          'Una balada lenta y romántica para abrazarnos',
          'Algo movido para que la fiesta explote',
          'Nuestra canción especial, la que sea que tengamos',
          'Es muy pronto para pensar en eso, pero sería lindo',
        ],
      },
    ],
  },
  {
    theme: 'Dormir Juntos',
    subtitle: 'Cómo nos imaginamos compartir la cama algún día',
    questions: [
      {
        question: '¿Cómo te imaginas que dormirías conmigo?',
        options: [
          'Abrazados toda la noche como koalas',
          'Empezaríamos abrazados pero cada uno se iría a su lado',
          'Yo robo todas las mantas y tú sufrirías',
          'Tú roncas / te mueves mucho y sería una aventura',
        ],
      },
      {
        question: '¿Qué lado de la cama prefieres?',
        options: [
          'El de la pared, me siento más seguro/a',
          'El del borde, necesito escapar fácil',
          'Me da igual, donde sea que estés tú',
          'El de la mesita de noche para dejar el celular',
        ],
      },
      {
        question: '¿Dormirías con la luz del celular prendida o todo oscuro?',
        options: [
          'Todo oscuro, soy sensible a la luz',
          'Con un poquito de luz tenue no me molesta',
          'Con el celular en la mano hasta que me quede dormido/a',
          'Con la tele prendida de fondo para dormir',
        ],
      },
      {
        question: '¿Qué es lo primero que harías al despertar junto a tu pareja?',
        options: [
          'Mirarlo/a dormir un ratito antes de que despierte',
          'Darle un beso y acurrucarme',
          'Ir a preparar desayuno para sorprenderlo/a',
          'Revisar el celular y después mimarlo/a',
        ],
      },
      {
        question: '¿Siesta juntos: sí o no?',
        options: [
          'Sí, es de las mejores cosas de la vida',
          'Sí, pero yo me duermo de verdad y tú solo descansas',
          'No logro dormir siesta, pero me quedo haciendo cucharita',
          'No me gustan las siestas, prefiero hacer algo',
        ],
      },
    ],
  },
];

/**
 * Gets a dynamically selected themed quiz based on the current date.
 */
export function getDailyQuiz(dateStr: string): DailyQuiz {
  if (dateStr >= QUIZ_SERIES_START) {
    const day = Math.floor(
      (Date.parse(`${dateStr}T00:00:00Z`) - Date.parse(`${QUIZ_SERIES_START}T00:00:00Z`)) /
        86400000,
    );
    const edition = NEW_QUIZZES[day];
    return {
      id: `daily-quiz-${dateStr}`,
      theme: edition?.theme || 'Nuevas preguntas en camino',
      subtitle:
        edition?.subtitle ||
        'Completaron esta serie. Las preguntas anteriores no volverán a salir.',
      questions:
        edition?.questions.map((question, index) => ({
          ...question,
          id: `series-1-${day}-${index}`,
          options: question.options as [string, string, string, string],
        })) || [],
    };
  }
  const dateParts = dateStr.split('-');
  const yearNum = parseInt(dateParts[0] || '2026', 10);
  const monthNum = parseInt(dateParts[1] || '1', 10);
  const dayNum = parseInt(dateParts[2] || '1', 10);

  // Determine Southern Hemisphere Season (Chile)
  let seasonKey = 'winter'; // Jun, Jul, Aug

  if (monthNum === 12 && dayNum >= 20 && dayNum <= 25) {
    seasonKey = 'christmas';
  } else if (monthNum === 6 || monthNum === 7 || monthNum === 8) {
    seasonKey = 'winter';
  } else if (monthNum === 9 || monthNum === 10 || monthNum === 11) {
    seasonKey = 'spring';
  } else if (monthNum === 12 || monthNum === 1 || monthNum === 2) {
    seasonKey = 'summer';
  } else if (monthNum === 3 || monthNum === 4 || monthNum === 5) {
    seasonKey = 'autumn';
  }

  const seed = dayNum * 7 + monthNum * 13 + yearNum;

  // Filter quizzes including general + current season quizzes
  const availablePool = THEMED_QUIZZES.filter((q) => !q.season || q.season === seasonKey);

  const total = availablePool.length;
  // If pool is empty for some reason, fallback to a safe index
  if (total === 0) {
    return {
      id: `daily-quiz-${dateStr}`,
      theme: 'Error',
      subtitle: 'No quizzes available',
      questions: [],
    };
  }

  const selectedQuizIndex = seed % total;
  const baseQuiz = availablePool[selectedQuizIndex];

  // Map to the DailyQuiz format, adding IDs to questions
  const mappedQuestions: QuizQuestion[] = baseQuiz.questions.map((q, index) => ({
    id: `q-${dateStr}-${index}`,
    question: q.question,
    options: q.options as [string, string, string, string],
  }));

  return {
    id: `daily-quiz-${dateStr}`,
    theme: baseQuiz.theme,
    subtitle: baseQuiz.subtitle,
    questions: mappedQuestions,
  };
}
