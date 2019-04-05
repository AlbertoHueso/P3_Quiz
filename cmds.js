

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
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

                rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = async (rl, id) => {
   			
   			try {

   				//Waiting for the result of the promise checkAnswer				
   				let _correct= await checkAnswer(rl,id);
   				
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
        
  			}
    		catch (error) {

    		//We show error message
    		if (error.message)
            errorlog(error.message);

        	//we show error from a throw
        	else errorlog(error);
            rl.prompt();
	}	
	

}


/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd = async rl => {

    let score=0;
    //Questions to be resolved
    let toBeResolved=[];

   
    
    //We fill the array with the questions indexes to be resolved
    model.getAll().forEach((quiz, id) => {
        toBeResolved.push(id);
        
    });





    if (!(toBeResolved.length>=1)){
    	 errorlog(`No hay preguntas para resolver`);
    	 rl.prompt();
    }
    else {

    	while (toBeResolved.length>=1){
    		
    		//Contains the index of the question to ask in the model
    		let _id=_randNumber(toBeResolved.length);

    		//Contains the index where _id is stored in toBeResolved
    		let _index=toBeResolved[_id];

    		//We remove the value from the toBeResolved array
    		toBeResolved.splice(_id,1);

    		try {
	    		//We await and check the answer 
	    		let _correct= await checkAnswer(rl,_index);
	    		
	    		if (_correct){	
	    			score++;
	    			console.log(`CORRECTO -	Lleva ${score} aciertos.`)
	    			if (toBeResolved.length===0){
	    				console.log("No hay nada más que preguntar.");
	    				console.log(`Fin del juego.	Aciertos: ${score}`);
	    				biglog(score,'magenta');
	    			}
    			}else{
    				console.log(`INCORRECTO\nFin del juego.	Aciertos:	${score}`);
    				biglog(score,'magenta');
    				rl.prompt();

    				//We break the while 
    				break;
    			}	

    		}
    		catch (error) {
	            errorlog(error.message);
	            rl.prompt();
        } 
        
    	}

    }
    

    
    rl.prompt();

    
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

					 if (typeof id === "undefined") {
			       
			        throw(`Falta el parámetro id.`);
			        
			    } else {

			    	
			            const quiz = model.getByIndex(id);

			            rl.question(colorize(`${quiz.question}?`, 'red'), answer => {

			            	answer=answer.toLowerCase().trim();
			            	
			            	if (answer===quiz.answer.toLowerCase().trim()){
			            		resolve (true);
			            	}
			            	else {
			            		
			                resolve (false);
			            	}
			    
			    		});
			    		
			    	
			    	
				};
	});
    
   

}

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