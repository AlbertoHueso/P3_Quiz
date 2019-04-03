const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db.sqlite',
  logging: false

})

sequelize.define(
  'quiz', 
  {  question: {
    type:Sequelize.STRING,
    unique: { msg: "Ya existe la pregunta"},
    validate: { 
        notEmpty: { msg: "La pregunta no puede estar vacía"}
      }

  },
     answer: {
    type:Sequelize.STRING,    
    validate: { 
        notEmpty: { msg: "La respuesta no puede estar vacía"}
      }

  }
  }
);
 
 sequelize.sync()
.then(() => sequelize.models.quiz.count())
.then((count) => {
  if (count===0) {
    return ( 
      sequelize.models.quiz.bulkCreate([
      { question: "Capital de Italia", answer: "Roma"},
      { question: "Capital de Francia", answer: "París"},
      { question: "Capital de España", answer: "Madrid"},
      { question: "Capital de Portugal", answer: "Roma"},
      ])
      
    )
  } 
})
.catch( err => console.log(`   ${err}`));

 /*
const quiz = sequelize.define(
  'quiz', 
  { question: { 
      type: Sequelize.STRING,
      unique: { msg: "Ya existe la pregunta"},
      validate: { 
        notEmpty: { msg: "La pregunta no puede estar vacía"}
      }
    },
    answer: {
      type: Sequelize.STRING,
      validate: { 
        notEmpty: { msg: "La respuesta no puede estar vacía"}
      }
    }
  }
);
 
 
sequelize.sync()
.then(() => sequelize.models.quiz.count())
.then((count) => {
  if (!count) {
    returns sequelize.models.quiz.bulkCreate([
      { question: "Capital de Italia", answer: "Roma"},
      { question: "Capital de Francia", answer: "París"},
      { question: "Capital de España", answer: "Madrid"},
      { question: "Capital de Portugal", answer: "Roma"},
    ])
   } 
})
.catch( err => console.log(`   ${err}`));
 
 */




module.exports = sequelize;