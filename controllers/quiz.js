const Sequelize = require("sequelize");
const {models} = require("../models");

// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findById(quizId)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
    .then(quizzes => {
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "", 
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });
};

//GET /quizzes/randomplay
exports.randomplay = (req, res, next) => {

        req.session.score = req.session.score || 0;
        req.session.randomPlay = req.session.randomPlay || {};

        models.quiz.count()
            .then(function (count) {
                return models.quiz.findAll({where:{id:{$notIn :req.session.randomPlay}}});
            })
            .then(function(quizzes){
                if(quizzes.length>0)
                    return quizzes[parseInt(Math.random()*quizzes.length)];
                else
                    return null;
            })
            .then(function (quiz){
                if(quiz){
                    if(req.session.score == req.session.randomPlay.length-1){
                        req.session.randomPlay.push(quiz.id);
                        res.render('quizzes/random_play',{
                            quiz:quiz,
                            score:req.session.score
                        });} else{
                        res.render('quizzes/random_play',{
                            quiz:quiz,
                            score:req.session.score
                        });
                    }
                }else{
                    var score = req.session.score;
                    req.session.score =0;
                    req.session.randomPlay = {};
                    res.render('quizzes/random_nomore',{
                        score:score
                    });
                }
            })

        .catch(error => {
            req.flash('error', 'Error deleting the Quiz: ' + error.message);
            next(error);
        });

};

//GET /quizzes/randomcheck/:quiz?answer=respuesta
exports.randomcheck = function (req, res, next) {
    var answer = req.query.answer || "";
    var result = answer.toLowerCase().trim() === req.quiz.answer.toLowerCase().trim();

    /*
    result = result.replace(/á/gi, "a");
    result = result.replace(/é/gi, "e");
    result = result.replace(/í/gi, "i");
    result = result.replace(/ó/gi, "o");
    result = result.replace(/ú/gi, "u");

    answer = answer.replace(/á/gi, "a");
    answer = answer.replace(/é/gi, "e");
    answer = answer.replace(/í/gi, "i");
    answer = answer.replace(/ó/gi, "o");
    answer = answer.replace(/ú/gi, "u");
    */
    if(!result){
        req.session.randomPlay ={};
    }else{
        req.session.score ++;}
    res.render('quizzes/random_result', {
        score:req.session.score,
        quiz: req.quiz,
        result: result,
        answer: answer
    });
};
