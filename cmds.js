

const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model');
const Sequelize = require('sequelize');

/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
    log("Commandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente.");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado.");
    log("  test <id> - Probar el quiz indicado.");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */

exports.listCmd = rl => {
   


    models.quiz.findAll()
    .each(quiz =>{
    	
    	log(`[${colorize(quiz.id,'magenta')}]: ${quiz.question}`);
    	
    })
    .catch(error =>{
    	errorlog(error.message);
    })
    .then(()=>{
    	rl.prompt();
    });
};

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {
    validateId(id)

    .then (id => models.quiz.findByPk(id))
    .then(quiz => {

    	if (!quiz){
    		throw new Error (`No existe un quiz asociado al id=${id}`);
    		}
    		log(` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    	})
    
    .catch(error =>{
    	errorlog(error.message);
    })
    .then(()=>{
    	rl.prompt();
    });
};


/**
 * Añade un nuevo quiz al módelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = rl => {

    rl.question(colorize(' Introduzca una pregunta: ', 'red'), q => {
    	
        rl.question(colorize(' Introduzca la respuesta ', 'red'), a => {

            models.quiz.create({ question: q.trim(), answer: a.trim()})

            .then (() =>{
            	log(` ${colorize('Se ha añadido', 'magenta')}: ${q} ${colorize('=>', 'magenta')} ${a}`);
            	rl.prompt();
            })
            .catch (Sequelize.ValidationError,error =>{
            	errorlog('El quiz es erroneo');
            	error.errors.forEach (({message}) => errorlog(message));
            })
            .catch(error =>{
    		errorlog(error.message);
    })
        });
    });
};


/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {
    validateId(id)

    .then (id => models.quiz.findByPk(id))
    .then(quiz => {

    	if (!quiz){
    		throw new Error (`No existe un quiz asociado al id=${id}`);
    		}
    		models.quiz.destroy({where: {id} });
    	})
    
    .catch(error =>{
    	errorlog(error.message);
    })
    .then(()=>{
    	rl.prompt();
    });
};


/**
 * Edita un quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {
validateId(id)

    .then (id => models.quiz.findByPk(id))
    .then(quiz => {

    	if (!quiz){
    		throw new Error (`No existe un quiz asociado al id=${id}`);
    		}
    		rl.question(colorize(' Introduzca una pregunta: ', 'red'), q => {
    			rl.question(colorize(' Introduzca la respuesta ', 'red'), a => {

            quiz.update({ question: q.trim(), answer: a.trim()})

            .then (() =>{
            	log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${q} ${colorize('=>', 'magenta')} ${a}`);
            	rl.prompt();
            })
            .catch (Sequelize.ValidationError,error =>{
            	errorlog('El quiz es erroneo');
            	error.errors.forEach (({message}) => errorlog(message));
            	rl.prompt();
            })
            
        });
    		})
    	})
    
    .catch(error =>{
    	errorlog(error.message);
    })
    .then(()=>{
    	rl.prompt();
    });
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {
   			
   			

   				//Call to checkAnswer			
   				checkAnswer(rl,id)

   				//When the Promise finalizes returns _correct value
   				.then(_correct =>{
            	if (_correct){
            		console.log("Su respuesta es correcta");
                    biglog("Correcta",'green');
                    rl.prompt();
            	}
            	else {
                console.log("Su respuesta es incorrecta");
                    biglog("Incorrecta",'red');
                    rl.prompt();
            	}
        		})
  			
  			  .catch(error =>{
    			errorlog(error.message);
    			rl.prompt();
    		})
    		

    		
	}	
	




/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd =  rl => {

    let score=0;
    //Questions ids to be resolved
    let toBeResolved=[];

   //Obtaining all quizzes
    models.quiz.findAll()

    //For each of them we add to the toBeResolved array the id
    .each(quiz =>{
    	
    	toBeResolved.push(quiz.id);
    })

   .then (() => {
   	 if (!(toBeResolved.length>=1)){
    	 errorlog(`No hay preguntas para resolver`);
    	 rl.prompt();
    }
    else {
    		//Playing this question
    		playAnswer();
    		
    		
        
    	
    }
    rl.prompt();
   })
   .catch(error =>{
	            errorlog(error.message);
	            rl.prompt();
        } );

   			/**
   			Shows a random question and checks if the answer is correct
   			If it is correct adds a point to the score, show it, and asks another question
			If it is wrong finalizes the game and shows the final score
			It works recursively
   			*/
		   	playAnswer= () =>{

		   	//Contains the index of the question to ask in the model
		    		let _id=_randNumber(toBeResolved.length);

		    		//Contains the index where _id is stored in toBeResolved
		    		let _index=toBeResolved[_id];

		    		//We remove the value from the toBeResolved array
		    		toBeResolved.splice(_id,1);

		    		
			    		//We await and check the answer 
			    		checkAnswer(rl,_index)

			    		.then(_correct =>{
			    		
			    		if (_correct){	
			    			score++;
			    			console.log(`CORRECTO -	Lleva ${score} aciertos.`)
			    			if (toBeResolved.length===0){
			    				console.log("No hay nada más que preguntar.");
			    				console.log(`Fin del juego.	Aciertos: ${score}`);
			    				biglog(score,'magenta');
			    				
			    			}
			    			else {
			    				playAnswer();
			    			}
			    			rl.prompt();
		    			}else{
		    				console.log(`INCORRECTO\nFin del juego.	Aciertos:	${score}`);
		    				biglog(score,'magenta');
		    				rl.prompt();

		    				
		    			}	
		    		})
		    		
		    		
		   }

   
};


/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
    log('Autores de la práctica:');
    log('Alberto', 'green');
    log('Hueso', 'green');
    rl.prompt();
};


/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};




/**
Función que retorna un entero aleatorio entre 0 y max (no incluido)
@param max Número límite entre el que se calculan los enteros
   		
@returns  {number} entero entre 0 y max	(no incluido este último)	

*/
 const _randNumber =(max) =>{
    	_number= Math.floor(Math.random()*max);
    	return _number;
    }


/**
*Función que retorna una promesa
*La promesa resuelve true si la respuesta es correcta, false en caso contrario
*Arroja una excepción si el @param id no está definido
*@param rl Objeto readline usado para implementar el CLI.
*@param id Clave del quiz a probar.
*@returns {Promise} Promesa
*/
const checkAnswer = (rl, id) => {

	return new Promise(function(resolve, reject) {

				validateId(id)

			    .then (id => models.quiz.findByPk(id))
    			.then(quiz => {
    					if (!quiz){
    					throw new Error (`No existe un quiz asociado al id=${id}`);
    					}
    					rl.question(colorize(`${quiz.question}?`, 'red'), answer => {

			            	answer=answer.toLowerCase().trim();
			            	
			            	if (answer===quiz.answer.toLowerCase().trim()){
			            		resolve (true);
			            	}
			            	else {
			            		
			                resolve (false);
			            	}
			    
			    		});



    				})
    				.catch(error =>{
    				errorlog(error.message);
    				rl.prompt();
    				});     
	
	});
    
   

}
/**
Función que comprueba si un id es correcto

@param id
@returns {Promise} Si ides indefinido o no es un número muestra sendos mensajes de error y rechaza la promesa
Si es un número resuelve la promesa y retorna el valor de id
*/
const validateId = id =>{
	 
	return new Promise ((resolve, reject) =>{
		 if (typeof id === "undefined"){
		 	reject(new Error (`Falta el parámetro <id>.`))
		 }else{
		 	id=parseInt(id);//Se convierte en número, en la parte entera
		 	if (Number.isNaN(id)){
		 		reject(new Error (`El valor del parámetro <id> no es un número.`))
		 	}else{
		 		resolve(id);
		 	}
		 }
	});
	 
};


