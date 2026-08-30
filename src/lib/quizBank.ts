// ============================================================
// Coliflor — Date-Aware & Seasonally Tailored Daily Quiz Bank
// Rotates whole themed quizzes instead of individual questions
// ============================================================

import type { DailyQuiz, QuizQuestion } from './types';

export interface ThemedQuiz {
  theme: string;
  subtitle: string;
  season?: 'summer' | 'winter' | 'spring' | 'autumn' | 'christmas';
  questions: Omit<QuizQuestion, 'id'>[];
}

export const THEMED_QUIZZES: ThemedQuiz[] = [
  {
    theme: "Noches de Chat",
    subtitle: "Nuestras conversaciones cuando no estamos juntos",
    questions: [
      {
        question: "Cuando nos quedamos hablando hasta tarde por chat, ¿qué es lo que más disfrutas?",
        options: [
          "Que se nos pasa el tiempo volando sin darnos cuenta",
          "Cuando nos ponemos profundos y hablamos de la vida",
          "Los coqueteos y mensajes más atrevidos de madrugada",
          "Cuando nos mandamos memes y videos sin parar",
        ],
      },
      {
        question: "¿Qué prefieres recibir de mí cuando estás ocupado/a estudiando o trabajando?",
        options: [
          "Un mensajito corto de 'te extraño' o ánimos",
          "Un audio contándome algo chistoso que te pasó",
          "Un meme o video para desconectar un rato",
          "Que me des mi espacio hasta que me desocupe",
        ],
      },
      {
        question: "Si te dejo en 'visto' sin querer por un buen rato:",
        options: [
          "Me da igual, sé que debes estar ocupado/a",
          "Me paso un poco de rollos al principio",
          "Te mando otro mensaje para molestarte",
          "Te devuelvo la misma moneda después",
        ],
      },
      {
        question: "Sobre las videollamadas antes de dormir:",
        options: [
          "Me encantan, me gusta verte la cara antes de dormir",
          "Prefiero llamadas normales, me da flojera arreglarme",
          "Son ricas de vez en cuando, no para todos los días",
          "Prefiero puro chat de texto, soy más de escribir",
        ],
      },
      {
        question: "¿Cuál es tu forma favorita de decirme buenas noches por mensaje?",
        options: [
          "Un texto largo y tierno deseándome lindos sueños",
          "Un 'descansa amor' con muchos emojis",
          "Un audio con voz de tuto",
          "Un sticker chistoso o tierno de buenas noches",
        ],
      },
    ],
  },
  {
    theme: "Maratón y Sillón",
    subtitle: "Compartiendo series y películas a distancia o juntos",
    questions: [
      {
        question: "Si estamos viendo una serie juntos (cada uno en su casa) y yo adelanto un capítulo:",
        options: [
          "¡Te mato! Es una traición imperdonable",
          "Me da un poco de lata, pero te obligo a verlo de nuevo conmigo",
          "Me da igual, yo también lo he hecho",
          "Te pido que me cuentes qué pasa porque soy ansioso/a",
        ],
      },
      {
        question: "¿Qué género de películas prefieres para ver abrazados (cuando nos vemos)?",
        options: [
          "Terror o suspenso, para tener excusa y abrazarte fuerte",
          "Comedia romántica, para ponernos tiernos",
          "Acción o ciencia ficción, algo muy entretenido",
          "Una comedia tonta para reírnos a carcajadas",
        ],
      },
      {
        question: "A la hora de elegir qué ver en Netflix/Prime:",
        options: [
          "Me gusta que tú decidas, casi siempre le achuntas",
          "Nos demoramos más eligiendo que viendo la película",
          "Me gusta imponer mi elección porque tengo buen gusto",
          "Tenemos una lista de pendientes súper organizada",
        ],
      },
      {
        question: "Si comemos algo mientras vemos una película, tiene que ser:",
        options: [
          "Cabritas dulces o saladas, un clásico",
          "Algo chatarra contundente (pizza, sushi, hamburguesa)",
          "Cositas dulces (chocolates, gomitas, helado)",
          "Cualquier cosa sirve mientras estemos juntos",
        ],
      },
      {
        question: "Cuando vemos una película, ¿cómo te comportas?",
        options: [
          "Comento todo lo que pasa en cada escena",
          "Veo todo en completo silencio y concentrado/a",
          "Me quedo dormido/a a la mitad de la película",
          "Me distraigo con el celular a cada rato",
        ],
      },
    ],
  },
  {
    theme: "Citas con Presupuesto",
    subtitle: "Panoramas de estudiantes y amores jóvenes",
    questions: [
      {
        question: "Si andamos con poca plata este fin de semana, ¿cuál es la mejor cita?",
        options: [
          "Comprar algo para picar e ir a un parque a conversar",
          "Juntarnos en la casa de uno a cocinar algo simple",
          "Caminar por la ciudad y comer un heladito",
          "Maratón de juegos o series sin gastar un peso",
        ],
      },
      {
        question: "A la hora de pagar cuando salimos:",
        options: [
          "Me gusta que vayamos a medias siempre (mitad y mitad)",
          "Prefiero que una vez invites tú y a la próxima yo",
          "A veces me gusta invitar yo todo para regalonearte",
          "Calculamos exactamente lo que comió cada uno",
        ],
      },
      {
        question: "Si te quiero sorprender con un detalle barato pero lindo:",
        options: [
          "Una carta o algo hecho a mano por ti",
          "Que me pases a buscar de sorpresa",
          "Mi chocolate o dulce favorito",
          "Que me mandes una playlist hecha para mí",
        ],
      },
      {
        question: "El mejor panorama de calle para nosotros es:",
        options: [
          "Ir a vitrinear ropa o cosas frikis sin comprar nada",
          "Subir un cerro o ir a la naturaleza",
          "Buscar algún evento gratis (ferias, tocatas, exposiciones)",
          "Ir a probar la comida callejera más barata y rica",
        ],
      },
      {
        question: "¿Qué opinas de las citas elegantes y caras?",
        options: [
          "Me encantan para fechas especiales como aniversarios",
          "Me incomodan un poco, prefiero lo casual",
          "Soñadas, ojalá cuando trabajemos vayamos seguido",
          "Me da igual el lugar, lo que importa es la compañía",
        ],
      },
    ],
  },
  {
    theme: "Estudios y Apoyo Mutuo",
    subtitle: "Sobreviviendo a la U o al trabajo juntos",
    questions: [
      {
        question: "En época de exámenes o mucha carga, ¿cómo te puedo ayudar más?",
        options: [
          "Dándome ánimo por chat y entendiéndome si estoy distante",
          "Juntándonos a estudiar/trabajar en silencio acompañados",
          "Ayudándome a repasar o preguntándome la materia",
          "Llevándome algo rico de comer para sobrevivir",
        ],
      },
      {
        question: "Si me saco una mala nota o tengo un mal día:",
        options: [
          "Necesito un abrazo largo y que me escuches quejarme",
          "Prefiero distraerme hablando de cualquier otra cosa",
          "Que me des consejos objetivos para mejorar",
          "Que nos riamos juntos de la desgracia",
        ],
      },
      {
        question: "Cuando tú tienes éxito en algo importante (pasas el ramo, etc.):",
        options: [
          "Quiero celebrarlo saliendo a comer algo rico",
          "Me emociono más que tú y le cuento a todos",
          "Me basta con que me felicites y me digas que estás orgulloso/a",
          "Prefiero una celebración íntima y tranquila",
        ],
      },
      {
        question: "¿Qué te parece estudiar o hacer trabajos juntos?",
        options: [
          "Me encanta, me motiva verte concentrado/a",
          "Imposible, nos distraemos demasiado conversando",
          "Sirve si estamos cada uno en lo suyo con audífonos",
          "Solo sirve si estamos a distancia en videollamada",
        ],
      },
      {
        question: "Nuestra principal meta a corto/mediano plazo es:",
        options: [
          "Terminar nuestras carreras/estudios exitosamente",
          "Ahorrar plata para hacer nuestro primer viaje juntos",
          "Tener más independencia para vernos más",
          "Conseguir estabilidad para pensar en vivir juntos",
        ],
      },
    ],
  },
  {
    theme: "Fantasías a Futuro",
    subtitle: "Soñando con cuando vivamos juntos",
    questions: [
      {
        question: "Cuando al fin vivamos solos, ¿qué es lo primero que haremos?",
        options: [
          "Andar desnudos o en ropa interior por toda la casa",
          "Cocinar nuestra primera cena oficial en nuestro espacio",
          "Hacer una fiesta de inauguración con los amigos",
          "Dormir abrazados toda la noche sin que nadie moleste",
        ],
      },
      {
        question: "¿Qué regla sería inquebrantable en nuestra futura casa?",
        options: [
          "Nunca irnos a dormir enojados",
          "El que cocina, no lava los platos",
          "Tener un día a la semana sagrado para nosotros solos",
          "No revisar el celular mientras comemos juntos",
        ],
      },
      {
        question: "¿Cómo imaginas el estilo de nuestro futuro hogar?",
        options: [
          "Muy moderno, minimalista y ordenado",
          "Acogedor, lleno de plantitas, fotos y luces cálidas",
          "Medio friki/gamer, con nuestros hobbies por todos lados",
          "Un caos hermoso y funcional, lo que vaya saliendo",
        ],
      },
      {
        question: "Sobre tener mascotas cuando vivamos juntos:",
        options: [
          "¡Sí o sí! Un perrito para salir a pasear",
          "Prefiero un gato (o varios), son más independientes",
          "Mejor algo chiquito (hámster, peces) para empezar",
          "Al principio mejor solos para adaptarnos nosotros",
        ],
      },
      {
        question: "Si en el futuro trabajamos todo el día, nuestro momento especial será:",
        options: [
          "Tomar desayuno juntos antes de salir de la casa",
          "Llegar en la noche y contarnos el día en la cama",
          "Ver un capítulo de nuestra serie cenando",
          "El fin de semana, para no salir de la cama",
        ],
      },
    ],
  },
  {
    theme: "Intimidad y Confianza",
    subtitle: "Conectando físicamente en nuestros espacios",
    questions: [
      {
        question: "Cuando logramos tener la casa sola, ¿qué es lo que más te prende?",
        options: [
          "El misterio de saber que tenemos poco tiempo",
          "Poner música y crear un ambiente relajado sin apuros",
          "Que tomes la iniciativa apenas cerramos la puerta",
          "Hacer las cosas normales (ver tele, cocinar) pero muy pegaditos",
        ],
      },
      {
        question: "¿Qué caricia te gusta más cuando estamos solos relajados?",
        options: [
          "Piojitos en la cabeza hasta quedarme dormido/a",
          "Masajes en la espalda o el cuello",
          "Que me acaricies la cara y me des besos cortos",
          "Que me hagas cariño en las manos o brazos",
        ],
      },
      {
        question: "Si intentamos algo nuevo en la intimidad y sale chistoso o torpe:",
        options: [
          "Nos morimos de la risa y seguimos",
          "Me da un poco de vergüenza pero se me pasa rápido",
          "Paramos, nos reímos y volvemos a lo clásico",
          "Lo seguimos intentando hasta que salga bien",
        ],
      },
      {
        question: "¿Qué tipo de besos te vuelven loco/a?",
        options: [
          "Los besos lentos que van subiendo de intensidad",
          "Besos inesperados en el cuello o la mandíbula",
          "Los besos apasionados que te dejan sin aliento",
          "Besos tiernos de piquito todo el tiempo",
        ],
      },
      {
        question: "Para ti, el preámbulo (los previos) ideal comienza con:",
        options: [
          "Mensajes coquetos horas antes de vernos",
          "Un buen beso prolongado cuando nos saludamos",
          "Miradas fijas e insinuaciones sutiles",
          "Abrazos fuertes y roces 'sin querer' a cada rato",
        ],
      },
    ],
  },
  {
    theme: "Celos y Límites Sanos",
    subtitle: "Construyendo confianza día a día",
    questions: [
      {
        question: "Si alguien me está coqueteando muy descaradamente frente a ti:",
        options: [
          "Te agarro la mano y marco territorio sutilmente",
          "Me da risa porque sé que no me vas a pescar al otro/a",
          "Me enojo un poco y espero que tú lo/a cortes",
          "Me pongo a coquetearte yo el triple frente a esa persona",
        ],
      },
      {
        question: "Respecto a las contraseñas del celular:",
        options: [
          "Nos las sabemos, tenemos confianza total",
          "No me las sé ni me interesan, respeto tu privacidad",
          "Te paso mi celu si necesitas buscar algo, sin problemas",
          "Creo que el celular es 100% personal e intocable",
        ],
      },
      {
        question: "Si te sientes un poco inseguro/a o celoso/a por algo:",
        options: [
          "Te lo digo de frente para no pasarme rollos",
          "Me pongo un poco cortante hasta que me preguntas",
          "Lo proceso solo/a primero y después te comento",
          "Hago preguntas indirectas para tantear terreno",
        ],
      },
      {
        question: "Lo que más seguridad me da en nuestra relación es:",
        options: [
          "Cómo me hablas y el tono que usas conmigo",
          "Que me incluyas en tus planes y me presentes a tu gente",
          "Que cumplas lo que prometes, la consistencia",
          "Tu transparencia y que me cuentes tus cosas",
        ],
      },
      {
        question: "Si un(a) ex tuyo/a te vuelve a hablar 'en buena':",
        options: [
          "Te cuento altiro para que no haya secretos",
          "No le respondo o corto la conversa rápido",
          "Le respondo cortés pero súper distante",
          "Depende de cómo hayamos terminado, pero te lo menciono",
        ],
      },
    ],
  },
  {
    theme: "Resolución de Conflictos",
    subtitle: "Cuando nos enojamos",
    questions: [
      {
        question: "Cuando tenemos una discusión tonta por chat:",
        options: [
          "Prefiero llamarte por teléfono para arreglarlo rápido",
          "Te mando audios largos explicando mi punto",
          "Necesito dejar de responder un rato para calmarme",
          "Intento arreglarlo mandando un sticker tierno o chiste",
        ],
      },
      {
        question: "Después de arreglar una pelea, ¿qué necesitas?",
        options: [
          "Un abrazo bien apretado y besos",
          "Cambiar de tema y actuar como si nada hubiera pasado",
          "Que nos digamos qué aprendimos de esto",
          "Comer algo rico juntos para pasar el mal rato",
        ],
      },
      {
        question: "Mi peor defecto cuando discutimos es:",
        options: [
          "Me pongo muy terco/a y me cuesta dar el brazo a torcer",
          "Lloro de rabia o frustración fácilmente",
          "Saco cosas del pasado que nada que ver",
          "Me callo y me guardo las cosas para no pelear",
        ],
      },
      {
        question: "Lo que más valoro de cómo resolvemos nuestros problemas es:",
        options: [
          "Que nunca nos faltamos el respeto",
          "Que sabemos pedir perdón cuando nos equivocamos",
          "Que no dejamos que el problema dure días",
          "Que siempre llegamos a un acuerdo justo",
        ],
      },
      {
        question: "Si tú te equivocas en algo grande, la mejor forma de disculparte es:",
        options: [
          "Hablándolo de frente con honestidad brutal",
          "Mostrando con acciones que vas a cambiar",
          "Dándome un poco de tiempo y luego hablarme con cariño",
          "Con un pequeño detalle o regalo como ofrenda de paz",
        ],
      },
    ],
  },
  {
    theme: "Gustos y Rarezas",
    subtitle: "Las cosas que solo nosotros entendemos",
    questions: [
      {
        question: "¿Cuál es mi maña más rara que has descubierto?",
        options: [
          "Cómo como ciertos alimentos (ej: separar las cosas)",
          "Mis rituales antes de dormir",
          "Cómo reacciono cuando me asusto o sorprendo",
          "Palabras o sonidos raros que invento",
        ],
      },
      {
        question: "Si pudieras eliminar una de mis prendas de ropa, ¿cuál sería?",
        options: [
          "Esa polera/pantalón viejísimo que no quieres botar",
          "Tus zapatos o zapatillas más feas",
          "Algo que usas para estar en casa que es anti-sexy",
          "¡Nada! Me encanta tu estilo así tal cual",
        ],
      },
      {
        question: "Nuestra broma interna más chistosa es sobre:",
        options: [
          "Una palabra mal dicha que nos quedó pegada",
          "Algo vergonzoso que le pasó a uno de los dos",
          "Imitar a alguien que conocemos",
          "Un meme o video muy específico",
        ],
      },
      {
        question: "Si fuéramos una caricatura o personajes, seríamos:",
        options: [
          "Homero y Marge (uno muy tonto y el otro lo apaña)",
          "Shrek y Fiona (un poco ogros pero amorosos)",
          "Batman y Robin (haciendo un gran equipo)",
          "Cosmo y Wanda (siempre metiéndonos en problemas)",
        ],
      },
      {
        question: "¿Qué costumbre mía se te ha pegado desde que estamos juntos?",
        options: [
          "Decir ciertas frases o palabras tuyas",
          "Comer algo que antes no me gustaba tanto",
          "Escuchar tu música o ver tus series",
          "Tu forma de reír o algún gesto con las manos",
        ],
      },
    ],
  },
  {
    theme: "Familias y Amigos",
    subtitle: "Nuestros mundos chocando",
    questions: [
      {
        question: "Ir a comer a la casa de mis papás/familia te hace sentir:",
        options: [
          "Tranquilo/a, me caen súper bien",
          "Un poco nervioso/a todavía, quiero dar buena impresión",
          "Regaloneado/a, me dan mucha comida",
          "Silencioso/a, prefiero observar antes de hablar mucho",
        ],
      },
      {
        question: "Cuando salimos con mis amigos, tú:",
        options: [
          "Te integras súper bien y eres el alma de la fiesta",
          "Te quedas más pegadito/a a mí, modo bajo perfil",
          "Aprovechas de hacerme bullying amigable con ellos",
          "Te llevas bien con un par, pero no con todos",
        ],
      },
      {
        question: "Si tuviéramos que elegir a los padrinos de un futuro hijo (hipotético):",
        options: [
          "Tu mejor amigo/a y mi mejor amigo/a",
          "Nuestros hermanos (si tenemos)",
          "Alguien de nuestras familias",
          "Aún es muy pronto para pensar en eso",
        ],
      },
      {
        question: "Lo que más me gusta de tus amigos es:",
        options: [
          "Cómo te apoyan y te cuidan",
          "Que son muy divertidos y relajados",
          "Que me aceptaron súper rápido en el grupo",
          "Que siempre tienen buenos planes o casas para juntarse",
        ],
      },
      {
        question: "Cuando tenemos un cumpleaños familiar ineludible un sábado en la tarde:",
        options: [
          "Vamos juntos y aperramos como equipo",
          "Tratamos de ir un ratito no más y escaparnos",
          "Nos separamos y cada uno va a sus compromisos",
          "Nos quedamos pegados a la comida para que pase rápido",
        ],
      },
    ],
  },
  {
    theme: "Fantasías de Viajes",
    subtitle: "A dónde iremos cuando tengamos plata",
    questions: [
      {
        question: "Nuestro primer viaje juntos dentro del país debería ser a:",
        options: [
          "La playa, para tomar sol y comer mariscos",
          "El sur, a una cabaña con estufa a leña y bosque",
          "El norte, a ver el desierto y las estrellas",
          "Donde sea más barato, la cosa es viajar",
        ],
      },
      {
        question: "Si nos ganáramos un viaje todo pagado por 1 mes, ¿a dónde iríamos?",
        options: [
          "Europa, recorriendo muchas ciudades en tren",
          "Sudeste Asiático (Tailandia, Bali), playas y cultura",
          "Norteamérica (Disney, Nueva York, etc.)",
          "Caribe, puro resort y pulserita todo incluido",
        ],
      },
      {
        question: "Como compañero/a de viaje, yo soy de los que:",
        options: [
          "Armo un excel con todo planificado minuto a minuto",
          "Fluyo y decido en el momento qué hacer",
          "Me preocupo de sacar las mejores fotos",
          "Solo quiero probar toda la comida local",
        ],
      },
      {
        question: "En un viaje en bus/avión largo, nosotros estaríamos:",
        options: [
          "Yo durmiendo encima tuyo todo el camino",
          "Escuchando música con un audífono cada uno",
          "Comiendo puros snacks y conversando",
          "Viendo películas descargadas en el celu",
        ],
      },
      {
        question: "El mayor desafío de viajar juntos sería:",
        options: [
          "Ponernos de acuerdo en qué lugares visitar",
          "El desorden o mañas al compartir una habitación pequeña",
          "El cansancio que nos ponga de mal humor",
          "Ajustarnos al presupuesto sin pelear",
        ],
      },
    ],
  },
  {
    theme: "Nuestra Primera Vez...",
    subtitle: "Recordando los hitos",
    questions: [
      {
        question: "¿Qué recuerdas de nuestro primer beso?",
        options: [
          "Fue perfecto, de película",
          "Estábamos re nerviosos y fue medio torpe pero lindo",
          "Fue inesperado, me tomaste por sorpresa",
          "Nos costó caleta dar el paso, andábamos rodeando",
        ],
      },
      {
        question: "La primera vez que me viste, ¿qué pensaste?",
        options: [
          "'Qué atractivo/a es, tengo que acercarme'",
          "'Se ve simpático/a, pero no pensé que llegaríamos a esto'",
          "'Qué persona tan rara/intimidante'",
          "'Me cayó pésimo al principio'",
        ],
      },
      {
        question: "Nuestra primera cita oficial fue:",
        options: [
          "Muy romántica y planeada",
          "Súper casual, casi como amigos al principio",
          "Llena de silencios incómodos y nervios",
          "Muy divertida, no paramos de hablar",
        ],
      },
      {
        question: "El momento exacto en que me di cuenta que me gustabas en serio fue:",
        options: [
          "Cuando nos reímos de la misma tontera",
          "Cuando me cuidaste o te preocupaste por mí un día",
          "Después de un beso o momento muy íntimo",
          "Fue de a poco, no hubo un solo momento",
        ],
      },
      {
        question: "La primera vez que dijimos 'Te amo' (o lo demostramos fuerte):",
        options: [
          "Se me escapó sin querer",
          "Lo planeé y estaba muy nervioso/a",
          "Fue en un momento súper íntimo y sincero",
          "Aún nos cuesta decirlo, lo demostramos con acciones",
        ],
      },
    ],
  },
  {
    theme: "Especial Invierno",
    subtitle: "Días fríos, amor cálido",
    season: "winter",
    questions: [
      {
        question: "El mejor antojo de invierno para comer acurrucados es:",
        options: [
          "Sopaipillas pasadas o picarones",
          "Chocolatito caliente con malvaviscos",
          "Té o café con pancito recién tostado",
          "Algo chatarra pesado (pizza, papas fritas)",
        ],
      },
      {
        question: "Cuando llueve muy fuerte y estamos en la casa de uno:",
        options: [
          "Nos tiramos a la cama a ver películas bajo mil plumones",
          "Nos ponemos nostálgicos y conversamos horas",
          "Nos ponemos modo regaloneo intenso/hot",
          "Tratamos de cocinar algo rico para matar el tiempo",
        ],
      },
      {
        question: "Al dormir en invierno, nosotros:",
        options: [
          "Cucharita obligatoria para no morir de frío",
          "Yo te robo las frazadas a mitad de la noche",
          "Me pongo los calcetines más feos y gruesos",
          "Te pongo mis pies helados encima para molestarte",
        ],
      },
      {
        question: "Si salimos un día de mucho frío, lo ideal es:",
        options: [
          "Ir a un café bonito y cerrado",
          "Ir al cine, siempre está calentito",
          "Caminar rápido y muy abrazados con bufandas",
          "Mejor no salimos, nos devolvemos a la casa",
        ],
      },
      {
        question: "¿Qué prenda de invierno te gusta más cómo me queda?",
        options: [
          "Los chalecos grandotes u 'oversize'",
          "Los gorritos de lana (beanies)",
          "Un buen abrigo o chaqueta de cuero",
          "Pijama de polar o enterito chistoso",
        ],
      },
    ],
  },
  {
    theme: "Especial Verano",
    subtitle: "Calor, vacaciones y amor",
    season: "summer",
    questions: [
      {
        question: "En una tarde de mucho calor, el panorama ideal es:",
        options: [
          "Conseguir una piscina sí o sí",
          "Ir a tomar helado o algún trago muy frío",
          "Quedarnos con el ventilador en la cara sin hacer nada",
          "Ir al parque a la sombra de los árboles",
        ],
      },
      {
        question: "Sobre la ropa de verano, a mí me gusta verte con:",
        options: [
          "Traje de baño / bikini",
          "Ropa muy ligera y fresca, shorts o falditas",
          "Camisas abiertas o poleras sin mangas",
          "Lentes de sol y jockey, modo veraniego",
        ],
      },
      {
        question: "Para dormir en las noches de 30 grados:",
        options: [
          "Cero contacto, si me tocas transpiramos",
          "Dormimos casi sin ropa y con todo abierto",
          "Abrazados igual, no me importa el sudor",
          "Nos peleamos por quién se pone al lado del ventilador",
        ],
      },
      {
        question: "Si nos escapamos un fin de semana a la playa por el día:",
        options: [
          "Llevo quitasol, bloqueador y comida (modo mamá/papá)",
          "Solo llevamos toalla y compramos allá",
          "Me meto al agua aunque esté congelada",
          "Nos sacamos mil fotos en la arena al atardecer",
        ],
      },
      {
        question: "La mejor bebida de verano para compartir es:",
        options: [
          "Un mote con huesillo bien helado",
          "Cerveza o algún trago refrescante (mojito, ramazzotti)",
          "Jugo natural de fruta (melón, sandía)",
          "Helado de agua para la sed",
        ],
      },
    ],
  },
  {
    theme: "Mascotas y Perrhijos",
    subtitle: "Nuestra futura (o actual) familia de cuatro patas",
    questions: [
      {
        question: "Si tuviéramos que adoptar una mascota mañana mismo, ¿qué elegirías?",
        options: [
          "Un perrito rescatado, para sacarlo a pasear siempre",
          "Un gatito, son más independientes y limpios",
          "Algo exótico o diferente (hurón, conejo, erizo)",
          "Aún no estoy listo/a para esa responsabilidad",
        ],
      },
      {
        question: "Sobre dejar que las mascotas duerman en la cama con nosotros:",
        options: [
          "¡Obvio! Que duerman entre medio de los dos",
          "A los pies de la cama me parece bien",
          "Depende de si están limpios, pero prefiero su propia camita",
          "Jamás, la cama es sagrada y libre de pelos",
        ],
      },
      {
        question: "¿Cuál de los dos sería el más 'malcriador' con la mascota?",
        options: [
          "Yo, le daría comida a escondidas de la mesa",
          "Tú, lo dejarías hacer lo que quiera",
          "Ambos seríamos un desastre poniéndole límites",
          "Ninguno, seríamos dueños súper estrictos",
        ],
      },
      {
        question: "Si a la mascota no le gusta uno de nosotros al principio:",
        options: [
          "Me daría un poco de pena/celos",
          "Lo intentaría sobornar con premios y comida",
          "Le daría su espacio hasta que se acostumbre",
          "Me daría lo mismo, eventualmente cederá",
        ],
      },
      {
        question: "¿Qué nombre le pondríamos a una futura mascota juntos?",
        options: [
          "Un nombre de comida (Sushi, Taco, Choripan)",
          "Un nombre de persona humana seria (Roberto, Juan)",
          "Un nombre friki (de un anime, serie o juego)",
          "Un nombre tierno y clásico (Pelusa, Toby)",
        ],
      },
    ],
  },
  {
    theme: "Nuestra Música y Conciertos",
    subtitle: "El soundtrack de nuestra relación",
    questions: [
      {
        question: "Si nos vamos de viaje largo en auto/bus, ¿qué escuchamos?",
        options: [
          "Ponemos mi playlist porque tengo mejor gusto",
          "Ponemos tu playlist para que vayas contento/a",
          "Un podcast o programa para ir conversando",
          "Una playlist mitad y mitad para ser justos",
        ],
      },
      {
        question: "Nuestra canción (esa que nos dedicamos o nos recuerda al otro) nos hace sentir:",
        options: [
          "Piel de gallina y nostalgia de nuestros primeros días",
          "Ganas de cantarla a todo pulmón abrazados",
          "Ganas de bailarla ridículamente juntos",
          "Ternura, pero me da un poco de vergüenza admitirlo",
        ],
      },
      {
        question: "Si uno de los dos canta pésimo en la ducha o el auto:",
        options: [
          "Me río y le hago coros peor aún",
          "Lo molesto pero en el fondo me encanta",
          "Me tapo los oídos en modo de broma",
          "Le digo sutilmente que no deje su trabajo de día",
        ],
      },
      {
        question: "Sobre ir juntos a conciertos y festivales:",
        options: [
          "Me encanta, es de los mejores panoramas para gastar plata",
          "Acompaño si es tu artista favorito, pero no es mi onda",
          "Me agobia la multitud, prefiero verlos por YouTube",
          "Solo si podemos estar sentados y tranquilos",
        ],
      },
      {
        question: "Si descubres que me gusta un artista que tú odias en secreto:",
        options: [
          "Te molesto por el resto de la eternidad",
          "Te pongo esa música para castigarte a veces",
          "Lo acepto en silencio porque te quiero",
          "Trato de convencerte con argumentos de por qué es malo",
        ],
      },
    ],
  },
  {
    theme: "Juegos y Competencia",
    subtitle: "Hobbies, consolas y cartas",
    questions: [
      {
        question: "Si jugamos a algo competitivo (Mario Kart, Cartas, Ludo):",
        options: [
          "Soy un mal perdedor/a y me pico caleta",
          "Juego a ganar y te destruyo sin piedad",
          "Me da igual ganar, solo quiero reírme",
          "Te dejo ganar disimuladamente a veces",
        ],
      },
      {
        question: "Cuando tú te quedas pegado/a jugando tu videojuego favorito:",
        options: [
          "Me quedo mirándote jugar y te hago compañía",
          "Aprovecho de hacer mis cosas o ver mi serie",
          "Te pido que me enseñes o me pases el control",
          "Me da un poco de lata si te ignoras mucho rato",
        ],
      },
      {
        question: "El castigo ideal para el que pierde en un juego entre nosotros es:",
        options: [
          "Pagar la próxima comida o el próximo delivery",
          "Hacerle masajes al ganador por 15 minutos",
          "Cumplir un reto vergonzoso o penitencia",
          "Sacarse una prenda (si estamos solos y con ganas)",
        ],
      },
      {
        question: "Si armamos un puzzle grande o un Lego de muchas piezas:",
        options: [
          "Seríamos un gran equipo trabajando ordenados",
          "Pelearíamos porque uno es más lento/desordenado",
          "Uno terminaría haciéndolo todo y el otro mirando",
          "Lo dejaríamos a la mitad por aburrimiento",
        ],
      },
      {
        question: "¿Qué opinas de los juegos de mesa para cuando nos juntamos?",
        options: [
          "¡Me encantan! Especialmente si invitamos amigos",
          "Solo me gustan si son rápidos y de mucha risa",
          "Me aburren rápido, prefiero conversar o ver algo",
          "Soy demasiado competitivo/a, mejor evitarlos por la paz",
        ],
      },
    ],
  },
  {
    theme: "Apocalipsis y Humor",
    subtitle: "Situaciones hipotéticas y divertidas",
    questions: [
      {
        question: "Si hay un apocalipsis zombie mañana, nuestro plan es:",
        options: [
          "Tú te encargas de las armas, yo de las provisiones",
          "Robar un auto grande e irnos al sur o a la montaña",
          "Escondernos en el supermercado más cercano y atrincherarnos",
          "No duramos ni un día, nos muerden altiro",
        ],
      },
      {
        question: "Si nos ganamos la lotería grande hoy mismo (1 millón de dólares):",
        options: [
          "No le decimos a nadie y desaparecemos de viaje",
          "Compramos una casa altiro para vivir juntos",
          "Pagamos todas nuestras deudas y seguimos estudiando/trabajando",
          "Lo derrochamos todo en comida y gustos en una semana",
        ],
      },
      {
        question: "Si por un día pudieras leer mi mente, ¿qué descubrirías?",
        options: [
          "Que pienso en comida el 90% del tiempo",
          "Que soy mucho más ansioso/a de lo que parezco",
          "Que me paso rollos muy raros o chistosos todo el día",
          "Que pienso en ti más de lo que admito",
        ],
      },
      {
        question: "Si intercambiáramos cuerpos por un día como en las películas, lo primero que harías sería:",
        options: [
          "Manejarte el celular para leer todos tus chats",
          "Irme a mi casa a abrazar a mis propias mascotas/familia",
          "Hacer locuras con tu cuerpo para que pases vergüenza",
          "Experimentar cómo se siente la intimidad desde el otro lado",
        ],
      },
      {
        question: "Si tuvieras que elegirme un superpoder, me darías:",
        options: [
          "Teletransportación, para vernos cuando queramos sin pagar pasaje",
          "Invisibilidad, para asustarme a cada rato",
          "Leer mentes, para que sepas qué quiero sin decir nada",
          "Poder comer sin engordar, seríamos felices",
        ],
      },
    ],
  },
  {
    theme: "Regaloneos y Mimos",
    subtitle: "El lenguaje del contacto físico",
    questions: [
      {
        question: "Cuando estamos abrazados en el sillón o cama, tú eres:",
        options: [
          "El 'koala' que se pega y no me suelta por horas",
          "El que pide que le hagan cariñitos (piojitos/espalda)",
          "El que abraza un ratito y después necesita espacio",
          "El que se queda dormido a los 5 minutos",
        ],
      },
      {
        question: "¿En qué parte de mi cuerpo te gusta más que te acaricie?",
        options: [
          "La cabeza y el pelo (piojitos)",
          "La espalda (rasquitas suaves)",
          "El cuello y la nuca",
          "Los brazos o las manos",
        ],
      },
      {
        question: "Si llegas muy estresado/a, el mejor mimo físico es:",
        options: [
          "Un masaje en los hombros y cuello",
          "Que me abraces por detrás y me des un beso en el cuello",
          "Acostarme en tu pecho un rato en silencio",
          "Tomarme las manos fuerte mirándome a los ojos",
        ],
      },
      {
        question: "Caminar de la mano en la calle es:",
        options: [
          "Fundamental, me encanta que todos nos vean juntos",
          "Rico un rato, pero me transpiran las manos",
          "Prefiero ir abrazados de la cintura",
          "Normalmente vamos sueltos conversando, me da lo mismo",
        ],
      },
      {
        question: "Cuando te doy un beso de sorpresa mientras estás distraído/a:",
        options: [
          "Me asusto un poco pero me saco una sonrisa boba",
          "Te lo devuelvo inmediatamente con más ganas",
          "Me sonrojo si estamos en público",
          "Depende de qué estaba haciendo, me puedo desconcentrar",
        ],
      },
    ],
  },
  {
    theme: "Dinero y Ahorro",
    subtitle: "Hablando de platas sin pelear",
    questions: [
      {
        question: "Nuestra filosofía con la plata de la pareja es:",
        options: [
          "Cuentas claras conservan la relación (50/50 en casi todo)",
          "El que tiene más en el momento apaña al otro",
          "Invitamos por turnos, hoy tú, mañana yo",
          "Yo trato de pagar siempre que puedo para regalonearte",
        ],
      },
      {
        question: "Si logramos juntar plata extra a fin de mes, deberíamos:",
        options: [
          "Meterla a un fondo común para nuestro futuro/casa",
          "Gastarla en una cita espectacular que nos merecemos",
          "Ahorrarla para nuestro próximo viaje",
          "Comprar algo material que nos sirva a ambos (tele, consola)",
        ],
      },
      {
        question: "En cuanto al manejo del dinero, tú te consideras:",
        options: [
          "Una hormiguita ahorradora, cuido cada peso",
          "Muy gastador/a, me cuesta llegar a fin de mes",
          "Equilibrado/a, ahorro pero me doy mis gustos",
          "Desordenado/a, a veces no sé en qué se me fue la plata",
        ],
      },
      {
        question: "El gasto 'innecesario' en el que siempre caemos es:",
        options: [
          "Pedir delivery por flojera a cocinar",
          "Comprar cositas dulces o snacks",
          "Ir a tomar cafés caros o salir a bares",
          "Uber/Didi porque se nos hizo tarde o nos dio flojera",
        ],
      },
      {
        question: "Si estuviéramos apretadísimos de plata un mes:",
        options: [
          "Igual busco formas baratas de tener citas románticas",
          "Nos encerramos y vemos tele todo el mes",
          "Me estreso un poco y me pongo de mal humor",
          "Hacemos un presupuesto estricto en Excel",
        ],
      },
    ],
  },
  {
    theme: "Días Malos y Contención",
    subtitle: "Cómo ser un refugio para el otro",
    questions: [
      {
        question: "Si lloro frente a ti de frustración o pena, tú:",
        options: [
          "Me abrazas fuerte sin decir nada hasta que me calme",
          "Te desesperas un poco tratando de buscarme soluciones",
          "Tratas de hacerme reír para cambiar mi ánimo",
          "Me haces preguntas para que me desahogue hablando",
        ],
      },
      {
        question: "Cuando estoy enojado/a con el mundo y ando 'pesado/a':",
        options: [
          "Tienes paciencia y me das mi espacio",
          "Te enojas tú también de vuelta porque te frustra",
          "Me llevas la contra para intentar calmarme",
          "Me traes comida o algo dulce para amansarme",
        ],
      },
      {
        question: "La mejor frase que me puedes decir cuando me siento derrotado/a es:",
        options: [
          "'Estoy aquí contigo, no estás solo/a'",
          "'Tú puedes con todo esto, eres sequísimo/a'",
          "'Vamos a descansar, mañana será otro día'",
          "'¿A quién hay que pegarle?' (humor)",
        ],
      },
      {
        question: "Si uno de los dos se enferma feo (gripe, fiebre, etc.):",
        options: [
          "Pido que me dejen solo/a para no contagiar a nadie",
          "Me pongo modo guagua y quiero que me cuides todo el día",
          "Soy pésimo/a enfermo/a, me pongo mañoso/a",
          "Intento seguir funcionando igual como si nada",
        ],
      },
      {
        question: "Lo que más me calma de ti en medio de mi ansiedad es:",
        options: [
          "El tono de tu voz, muy suave y tranquilo",
          "Tus abrazos que me hacen sentir protegido/a",
          "Tu forma lógica de ver los problemas, me aterrizas",
          "Que simplemente te acuestes a mi lado",
        ],
      },
    ],
  },
  {
    theme: "Tiempo a Solas vs Juntos",
    subtitle: "Equilibrando el amor y la individualidad",
    questions: [
      {
        question: "Para ti, tener un día entero sin vernos ni hablarnos mucho:",
        options: [
          "Es necesario a veces para extrañarnos y recargar pilas",
          "Me genera un poco de ansiedad, prefiero hablarte",
          "Lo aprovecho al máximo haciendo mis cosas",
          "Me aburro, siento que el día está incompleto",
        ],
      },
      {
        question: "Cuando estás haciendo tus hobbies a solas (jugar, leer, entrenar):",
        options: [
          "Me encanta que igual me mandes un mensajito entre medio",
          "Prefiero desconectarme del celular por completo",
          "Me gusta que me preguntes por lo que estoy haciendo",
          "Quiero que respetes ese espacio 100% sin interrupciones",
        ],
      },
      {
        question: "Si salgo solo/a con mis amigos toda la noche, tú:",
        options: [
          "Estás feliz de que lo pase bien, duermes tranquilo/a",
          "Te quedas esperando un 'llegué bien' antes de dormir",
          "Aprovechas de armar panorama por tu cuenta",
          "Me extrañas y andas pendiente del celu",
        ],
      },
      {
        question: "En una relación sana, los intereses de ambos:",
        options: [
          "Tienen que tener muchas cosas en común",
          "Es mejor que sean distintos para no aburrirse",
          "Hay que intentar que nos gusten las cosas del otro",
          "No importan mientras se respete el espacio del otro",
        ],
      },
      {
        question: "Si llevamos muchos días viéndonos de corrido, yo:",
        options: [
          "Sigo queriendo verte igual al día siguiente",
          "Empiezo a necesitar un día en mi cueva",
          "Me pongo un poco más irritable sin querer",
          "Propongo hacer algo totalmente distinto para no rutinizarnos",
        ],
      },
    ],
  },
  {
    theme: "Redes Sociales y Mundo Digital",
    subtitle: "Likes, historias y privacidad",
    questions: [
      {
        question: "Publicar fotos juntos en Instagram/TikTok para mí es:",
        options: [
          "Bacán, me gusta mostrarte con orgullo al mundo",
          "Para ocasiones especiales nomás (cumpleaños, viajes)",
          "Muy poco, prefiero que nuestra relación sea privada",
          "Solo subiría fotos tontas o memes contigo",
        ],
      },
      {
        question: "Si subes una foto tuya donde sales increíble (sexy/guapo/a):",
        options: [
          "Soy el primero en comentar algo fogoso o babear",
          "Me da un poquitito de celos pero te doy like orgulloso/a",
          "Prefiero que me las mandes a mí en privado",
          "Te comento alguna tontera para molestarte",
        ],
      },
      {
        question: "Revisar los seguidores o a quién sigue tu pareja:",
        options: [
          "Es de tóxico/a, yo no lo hago ni me importa",
          "Lo he hecho un par de veces de puro sapo/a",
          "Si me da desconfianza alguien, me fijo",
          "No tengo tiempo ni ganas para andar haciendo eso",
        ],
      },
      {
        question: "Si alguien te responde una historia coqueteándote de frentón:",
        options: [
          "Lo ignoras olímpicamente",
          "Le respondes muy seco o le pones un límite claro",
          "Me cuentas riéndote y lo bloqueamos juntos",
          "Le respondes con una foto donde salimos los dos",
        ],
      },
      {
        question: "Tu opinión sobre tener las contraseñas del otro es:",
        options: [
          "Una falta de confianza y privacidad tremenda",
          "Normal si se da la situación de necesitar el celu",
          "Un voto de confianza total, las tenemos",
          "Me da lo mismo, no tengo nada que esconder",
        ],
      },
    ],
  },
  {
    theme: "Manejo del Estrés",
    subtitle: "Sobreviviendo la presión juntos",
    questions: [
      {
        question: "Cuando estás muy estresado/a, tu forma de actuar cambia a:",
        options: [
          "Me aíslo y me vuelvo más callado/a",
          "Me pongo muy irritable y salto por cualquier cosa",
          "Empiezo a limpiar y ordenar todo compulsivamente",
          "Como mucho más o puro azúcar por ansiedad",
        ],
      },
      {
        question: "Si los dos estamos pasando por una semana terrible al mismo tiempo:",
        options: [
          "Chocamos y discutimos más fácilmente",
          "Nos unimos más y somos un equipo de supervivencia",
          "Nos vemos menos para no traspasarnos mala onda",
          "Lloramos juntos comiendo chatarra",
        ],
      },
      {
        question: "¿Cuál es tu forma de 'botar' estrés que yo más noto?",
        options: [
          "Ponerte a jugar videojuegos por horas",
          "Dormir siestas muy largas",
          "Quejarte y hablar mucho rápido",
          "Hacer ejercicio o salir a caminar",
        ],
      },
      {
        question: "Si me ves colapsado/a por algo de trabajo/estudios que no me sale:",
        options: [
          "Me ofreces ayuda práctica (revisar texto, hacer un esquema)",
          "Me obligas a cerrar el computador un rato y descansar",
          "Me traes un café o tecito sin que te lo pida",
          "Me dices frases motivadoras para no rendirme",
        ],
      },
      {
        question: "El mejor escape de fin de semana para bajar el estrés sería:",
        options: [
          "Literalmente no salir de la cama todo el fin de semana",
          "Irnos a la naturaleza a respirar aire puro",
          "Ir a un lugar donde haya buena comida y copetes",
          "Hacer algo extremo o diferente (parque de diversiones, subir un cerro pesado)",
        ],
      },
    ],
  },
  {
    theme: "Metas a Corto Plazo",
    subtitle: "Nuestros próximos hitos",
    questions: [
      {
        question: "De aquí a un año, el hito más importante para nuestra relación sería:",
        options: [
          "Haber hecho nuestro primer viaje importante juntos",
          "Conseguir trabajos estables para pensar en independizarnos",
          "Conocernos aún mejor y mantener esta chispa",
          "Aprender a manejar mejor nuestras diferencias/peleas",
        ],
      },
      {
        question: "Si tuviéramos que elegir una meta económica de a dos para este año:",
        options: [
          "Ahorrar X monto para un pasaje o escapada",
          "No endeudarnos más en salidas a comer",
          "Juntar plata para comprar un auto a medias",
          "Comprar pasajes para ir a ver a nuestro artista favorito",
        ],
      },
      {
        question: "Una habilidad o hobby que me gustaría que aprendiéramos juntos es:",
        options: [
          "Aprender a cocinar platos ricos (y no pura chatarra)",
          "Aprender algún baile juntos (salsa, bachata)",
          "Aprender un idioma o hacer un curso online",
          "Meterle más al deporte o gimnasio como pareja",
        ],
      },
      {
        question: "El próximo gran paso en nuestra confianza íntima debería ser:",
        options: [
          "Hablar aún más abiertamente de nuestras fantasías",
          "Romper la vergüenza con cosas del cuerpo/baño",
          "Tener un 'finde solos' sin interrupciones familiares",
          "Animarnos a intentar cosas nuevas sin tabúes",
        ],
      },
      {
        question: "Lo que más me entusiasma de nuestro futuro cercano es:",
        options: [
          "Terminar esta etapa de estudios/junior y tener más tiempo",
          "La posibilidad de tener por fin nuestro propio espacio",
          "Todas las tonteras que nos quedan por reírnos",
          "Ver cómo creces en lo personal y apoyarte",
        ],
      },
    ],
  },
  {
    theme: "Fantasías de Independencia",
    subtitle: "Saliendo del nido",
    questions: [
      {
        question: "Cuando por fin nos independicemos, el mayor miedo será:",
        options: [
          "No saber cómo llegar a fin de mes y pagar las cuentas",
          "Tener que cocinar y limpiar todos los malditos días",
          "Que el convivir tanto tiempo arruine la 'magia'",
          "Extrañar las comodidades de nuestras familias",
        ],
      },
      {
        question: "Nuestro primer mueble comprado en conjunto será:",
        options: [
          "Una cama gigante y cómoda, es lo principal",
          "Un sillón ultra cómodo para ver series",
          "Una mesa grande para jugar juegos o invitar amigos",
          "Una tele 4K gigante",
        ],
      },
      {
        question: "Al decorar nuestra primera casa, la temática será:",
        options: [
          "Full plantas por todos lados (jungla urbana)",
          "Modo friki: repisas con coleccionables y consolas",
          "Minimalista: todo blanco, madera y ordenado",
          "Lo que nos regalen nuestras mamás y tías, modo sobrevivencia",
        ],
      },
      {
        question: "Si tenemos un fin de semana entero solos en nuestro nuevo depto:",
        options: [
          "Pasamos casi todo el tiempo en pelota",
          "Invitamos a los amigos a un asado o carrete altiro",
          "Nos dedicamos a armar muebles y limpiar profundamente",
          "Dormimos hasta las 2pm y pedimos pizza",
        ],
      },
      {
        question: "¿Quién será el encargado principal de la cocina?",
        options: [
          "Tú, porque cocinas mucho más rico",
          "Yo, porque tengo más ideas y me gusta",
          "Nos turnamos estrictamente un día y un día",
          "El delivery será nuestro mejor amigo",
        ],
      },
    ],
  },
  {
    theme: "Especial Otoño",
    subtitle: "Días frescos, amor cálido",
    season: "autumn",
    questions: [
      {
        question: "Con los días más frescos de otoño, ¿qué panorama te gusta más?",
        options: [
          "Caminar pisando hojas secas en el parque abrazados",
          "Ir a una cafetería rica a tomar chocolate caliente",
          "Acostarnos más temprano a ver series porque se oscurece",
          "Comprar cositas dulces para la hora del té juntos",
        ],
      },
      {
        question: "El mejor postre para compartir en un domingo nublado de otoño es:",
        options: [
          "Unos picarones pasados o sopaipillas",
          "Pie de limón o Kuchen de manzana",
          "Un brownie con helado",
          "Waffles o panqueques con manjar preparados en casa",
        ],
      },
      {
        question: "Sobre la ropa de media estación (otoño), me encanta verte con:",
        options: [
          "Gorritos (beanies) y bufandas ligeras",
          "Chaquetas de mezclilla o cuero",
          "Polar suavecito para abrazarte",
          "Chalecos delgados o cardigans tiernos",
        ],
      },
      {
        question: "En las tardes frías, el preámbulo perfecto es:",
        options: [
          "Hacer cucharita un buen rato hasta entrar en calor",
          "Besos sorpresa mientras cocinamos o preparamos el té",
          "Empezar a sacarnos los chalecos lentamente",
          "Darnos una ducha calentita juntos",
        ],
      },
      {
        question: "Si nos pilla un chaparrón sorpresa en la calle en otoño:",
        options: [
          "Corremos desesperados a buscar un techo riéndonos",
          "Te paso mi chaqueta para que no te mojes",
          "Caminamos lento y nos damos un beso bajo la lluvia (románticos)",
          "Me enojo un poco porque se me ensucian los zapatos/ropa",
        ],
      },
    ],
  },
  {
    theme: "Especial Primavera",
    subtitle: "Flores, solcito y alergias",
    season: "spring",
    questions: [
      {
        question: "En los días lindos de primavera, el mejor plan es:",
        options: [
          "Un picnic en un parque tirados en una manta",
          "Ir a un cerro o trekking ligero",
          "Tomar algo en una terraza de bar al atardecer",
          "Comprar un helado rico y caminar por la ciudad",
        ],
      },
      {
        question: "Si quieres regalarme algo en esta época, me encantaría:",
        options: [
          "Flores reales o una plantita bonita",
          "Un desayuno sorpresa en mi casa",
          "Organizar una cita al aire libre",
          "Algo dulce como bombones o alfajores",
        ],
      },
      {
        question: "Con la primavera llegan las alergias. Si ando modo zombie estornudando:",
        options: [
          "Me traes pañuelos y pastillas y me regaloneas",
          "Te ríes un poco de mi cara de destruido/a",
          "No te acercas mucho porque me lleno de mocos",
          "Me obligas a encerrarnos para que no sufra con el polen",
        ],
      },
      {
        question: "El cambio de clima pone a la gente más cariñosa. En esta época tú:",
        options: [
          "Andas más 'hot' y proactivo/a con la intimidad",
          "Andas más tierno/a, pidiendo más mimos y abrazos",
          "Te da energía para planear más salidas",
          "Estás igual que siempre, el clima te da lo mismo",
        ],
      },
      {
        question: "La primera 'escapada' primaveral ideal sería a:",
        options: [
          "El Cajón del Maipo o la montaña por el día",
          "Una escapada flash a la playa, aunque el agua esté helada",
          "Alojarnos en un glamping o domo romántico",
          "Alquilarnos un depto bonito con piscina en otra ciudad",
        ],
      },
    ],
  },
  {
    theme: "Especial Navideño",
    subtitle: "Pan de pascua y regalos",
    season: "christmas",
    questions: [
      {
        question: "¿Qué tradición navideña es la que más te gusta hacer en pareja?",
        options: [
          "Elegir nuestro regalito con mucha dedicación (o hacerlo)",
          "Juntarnos a comer pan de pascua y tomar cola de mono solos",
          "Acompañarnos a comprar regalos a los malls llenos de gente",
          "Hacernos una promesa o propósito para el año que viene",
        ],
      },
      {
        question: "A la hora de darte mi regalo de Navidad:",
        options: [
          "Prefiero dártelo a solas antes o después de la fiesta",
          "Me gusta que lo abras frente a toda mi familia",
          "Te dejo pistas para que lo encuentres modo juego",
          "Te lo doy a las 12 en punto como manda la tradición",
        ],
      },
      {
        question: "Si estamos complicados de plata para Navidad:",
        options: [
          "Hacemos un pacto de no darnos regalo material este año",
          "Nos hacemos regalos hechos a mano (cartas, cupones)",
          "Gastamos lo poco que tenemos en una buena comida",
          "Yo igual me endeudo un poquito para darte un gusto",
        ],
      },
      {
        question: "La mejor parte de pasar Año Nuevo juntos es:",
        options: [
          "El abrazo y el beso justo a las 12:00",
          "El carrete/fiesta con amigos hasta el amanecer",
          "Comer mucho en familia",
          "Hacer los ritos juntos (calzón amarillo, maletas)",
        ],
      },
      {
        question: "¿Cuál es tu postura frente al Pan de Pascua?",
        options: [
          "¡Con fruta confitada! Como debe ser",
          "Solo con nueces y almendras, odio la fruta confitada",
          "Sin nada, que sea un queque nomás",
          "Me carga el pan de pascua, prefiero otro postre",
        ],
      },
    ],
  },
];

/**
 * Gets a dynamically selected themed quiz based on the current date.
 */
export function getDailyQuiz(dateStr: string): DailyQuiz {
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
  const availablePool = THEMED_QUIZZES.filter(
    q => !q.season || q.season === seasonKey
  );

  const total = availablePool.length;
  // If pool is empty for some reason, fallback to a safe index
  if (total === 0) {
      return { id: `daily-quiz-${dateStr}`, theme: "Error", subtitle: "No quizzes available", questions: [] };
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
