/*********************************************************************************
*  WEB700 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: John Niagwan Student ID: 121092225 Date: 06/03/2024
*
*  Online (Cycliic) Link: https://thoughtful-dove-garters.cyclic.app
*
********************************************************************************/ 


var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var app = express();
var collegeData = require('./modules/collegeData');
var path = require('path');
app.use(express.static('images'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
const exphbs = require('express-handlebars');

app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        navLink: function(url, options) {
            return '<li' + ((url == app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') + '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));

app.set('view engine', '.hbs');

// Middleware function to set activeRoute
app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    next();
});

// Initialize collegeData
collegeData.initialize()
    .then(() => {
        // Route to handle students
        app.get("/students", (req, res) => {
            const courseParam = req.query.course;

            if (courseParam) {
                collegeData.getStudentsByCourse(parseInt(courseParam))
                    .then(students => {
                        if (students.length > 0) {
                            res.render("students",{students: students});
                        } else {
                            res.render("students", {message: "no results"});
                        }
                    })
                    .catch(() => {
                        res.render("students", {message: "no results"});
                    });
            } else {
                collegeData.getAllStudents()
                    .then(students => {
                        if (students.length > 0) {
                            res.render("students",{students: students});
                        } else {
                            res.render("students", {message: "no results"});
                        }
                    })
                    .catch(() => {
                        res.render("students", {message: "no results"});
                    });
            }
        });

        // Route to handle TAs
        app.get("/tas", (req, res) => {
            collegeData.getTAs()
                .then(tas => {
                    res.json(tas);
                })
                .catch(() => {
                    res.json({ message: 'no results' });
                });
        });

        // Route to handle courses
        app.get("/courses", (req, res) => {
            collegeData.getCourses()
                .then(courses => {
                    if (courses.length > 0) {
                        res.render("courses", {courses: courses});
                    } else {
                        res.render("courses", {message: "no results"});
                    }
                })
                .catch(() => {
                    res.render("courses", {message: "no results"});
                });
        });

        // Route to handle a single student by num
        app.get("/student/:studentNum", (req, res) => {
            let viewData = {};

            collegeData.getStudentByNum(req.params.studentNum)
                .then(data => {
                    if (data) {
                        viewData.student = data;
                    } else {
                        viewData.student = null;
                    }
                })
                .catch(() => {
                    viewData.student = null;
                })
                .then(collegeData.getCourses)
                .then(data => {
                    viewData.courses = data;

                    for (let i = 0; i < viewData.courses.length; i++) {
                        if (viewData.courses[i].courseId == viewData.student.course) {
                            viewData.courses[i].selected = true;
                        }
                    }
                })
                .catch(() => {
                    viewData.courses = [];
                })
                .then(() => {
                    if (viewData.student == null) {
                        res.status(404).send("Student Not Found");
                    } else {
                        res.render("student", { viewData: viewData });
                    }
                });
        });

        // POST route to update a student
        app.post("/student/update", (req, res) => {
            collegeData.updateStudent(req.body)
                .then(() => {
                    res.redirect("/students");
                })
                .catch(() => {
                    res.redirect("/students");
                });
        });

        // Route to handle a single course by id
        app.get("/course/:id", (req, res) => {
            const courseId = parseInt(req.params.id);
            collegeData.getCourseById(courseId)
                .then(course => {
                    if (course) {
                        res.render("course", {course: course});
                    } else {
                        res.status(404).send("Course Not Found");
                    }
                })
                .catch(() => {
                    res.render("course", {message: "no results"});
                });
        });

        app.get("/course/delete/:id", (req, res) => {
            const courseId = parseInt(req.params.id);
            collegeData.deleteCourseById(courseId)
                .then(() => {
                    res.redirect("/courses");
                })
                .catch(() => {
                    res.status(500).send("Unable to Remove Course / Course not found");
                });
        });

        app.get("/student/delete/:studentNum", (req, res) => {
            const studentNum = req.params.studentNum;
            collegeData.deleteStudentByNum(studentNum)
                .then(() => {
                    res.redirect("/students");
                })
                .catch(() => {
                    res.status(500).send("Unable to Remove Student / Student not found");
                });
        });

        // Default route
        app.get("/", (req, res) => {
            res.render('home');
        });

        // Route to handle about page
        app.get("/about", (req, res) => {
            res.render('about');
        });

        // Route to handle HTML demo page
        app.get("/htmlDemo", (req, res) => {
            res.render('htmlDemo');
        });

        app.post("/students/add", (req, res) => {
                    collegeData.addStudent(req.body)
                        .then(() => {
                            res.redirect("/students");
                        })
                        .catch((err) => {
                            // Handle error here
                            console.log(err);
                            res.redirect("/students/add");
                        });
                });

        // Route to handle add student page
        app.get("/students/add", (req, res) => {
            collegeData.getCourses()
                .then(courses => {
                    res.render('addStudent', {courses: courses});
                })
                .catch(() => {
                    res.render('addStudent', {courses: []});
                });
        });

        app.get("/courses/add", (req, res) => {
            res.render("addCourse");
        });

        app.post("/courses/add", (req, res) => {
            collegeData.addCourse(req.body)
                .then(() => {
                    res.redirect("/courses");
                })
                .catch((err) => {
                    // Handle error here
                    console.log(err);
                    res.redirect("/courses/add");
                });
        });

        app.post("/course/update", (req, res) => {
            collegeData.updateCourse(req.body)
                .then(() => {
                    res.redirect("/courses");
                })
                .catch((err) => {
                    // Handle error here
                    console.log(err);
                    res.redirect("/courses/update");
                });
        });

        // Handling unmatched routes
        app.use((req, res) => {
            res.status(404).sendFile(path.join(__dirname, '/images/404.jpeg'));
        });

        // Start the HTTP server after initialization
        app.listen(HTTP_PORT, () => {
            console.log("Server listening on port: " + HTTP_PORT);
        });
    })
    .catch(error => {
        console.error(error);
    });
