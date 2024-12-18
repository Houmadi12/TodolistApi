const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const cors = require('cors');
const mongoose = require('mongoose');
const Books = require('./Model/Books.js')

// Initialisation de l'application Express
const app = express();

// Connexion à MongoDB
mongoose.connect('mongodb+srv://soilihiambdouroihmane:07ULGDYSOKG79UrD@cluster.cww7c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster')
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((err) => console.error('Erreur de connexion à MongoDB : ', err));

// Middleware pour parser le body des requêtes
app.use(express.json());
app.use(cors());


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

// Options de configuration Swagger
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "My First API with Swagger",
            version: "1.0.0",
            description: "Documentation de l'API"
        },
        components: {
            schemas: {
                Formation: {
                    type: "object",
                    properties: {
                        nomForm: {
                            type: "string",
                            description: "Nom de la formation"
                        }
                    }
                }
            }
        },
        basePath: "/"
    },
    apis: ["app.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Configuration de Swagger UI
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Récupère tous les books
 *     description: Permet de Récupèrer tous les livres
 *     responses:
 *       200:
 *         description: Succès - Liste des livres
 */
app.get('/books', async (req, res) => {
    try {
        const books = await Books.find();  // Récupère tous les livres depuis la base de données
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des livres' });
    }
});

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Ajouter un book
 *     description: Permet d'ajouter un nouveau livre
 *     parameters:
 *       - in: body
 *         name: book
 *         description: Détails du livre à ajouter
 *         schema:
 *           type: object
 *           required:
 *             - title
 *           properties:
 *             title:
 *               type: string
 *             description:
 *               type: string
 *     responses:
 *       201:
 *         description: Livre ajouté avec succès
 */
app.post("/books", async (req, res) => {
    try {
        delete req.body._id;
        const newBook = new Books({
            title: req.body.title,
            description: req.body.description
        });

        if (!newBook.title) {
            return res.status(400).json({ error: "Le titre est requis" });
        }

        await newBook.save();  // Sauvegarde le livre dans la base de données
        res.status(201).json(newBook);  // Retourne le livre ajouté
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'ajout du livre" });
    }
});


/**
 * @swagger
 * /book/{id}:
 *   put:
 *     summary: Mettre ajour un book
 *     description: Endpoint pour mettre à jour les détails d'un book existant
 *     parameters:
 *       - in: body
 *         name: book
 *         description: Mise à jours du livre à ajouter
 *         schema:
 *           type: object
 *           required:
 *             - title
 *           properties:
 *             title:
 *               type: string
 *             description:
 *               type: string
 *     responses:
 *       201:
 *         description: Livre Modifier avec succès
 */
app.put("/books/:id", async (req, res) => {
    try {
        // Vérifier si au moins un champ à mettre à jour est présent
        if (!req.body.title && !req.body.description) {
            return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
        }

        // Trouver et mettre à jour le livre
        const updatedBook = await Books.findByIdAndUpdate(
            req.params.id, 
            {
                // N'inclure que les champs présents dans la requête
                ...(req.body.title && { title: req.body.title }),
                ...(req.body.description && { description: req.body.description })
            }, 
            { 
                new: true,  // Retourne le document mis à jour
                runValidators: true  // Valide les données avant mise à jour
            }
        );

        // Vérifier si le livre existe
        if (!updatedBook) {
            return res.status(404).json({ error: "Livre non trouvé" });
        }

        // Répondre avec le livre mis à jour
        res.status(200).json(updatedBook);
    } catch (error) {
        // Gestion des erreurs détaillée
        res.status(500).json({ 
            error: "Erreur lors de la mise à jour du livre",
            details: error.message 
        });
    }
});


/**
 * @swagger
 * /book/{id}:
 *   delete:
 *     summary: Supprimer un livre
 *     description: Endpoint pour supprimer un livre par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID du livre à supprimer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Livre supprimé avec succès
 */
app.delete("/books/:id", async (req, res) => {
    try {
        // Recherche et suppression du livre
        const deletedBook = await Books.findByIdAndDelete(req.params.id);

        // Vérifier si le livre existe
        if (!deletedBook) {
            return res.status(404).json({ error: "Livre non trouvé" });
        }

        // Répondre avec un message de confirmation
        res.status(200).json({ 
            message: "Livre supprimé avec succès",
            deletedBook: deletedBook // Optionnel : renvoyer les détails du livre supprimé
        });
    } catch (error) {
        // Gestion des erreurs détaillée
        res.status(500).json({ 
            error: "Erreur lors de la suppression du livre",
            details: error.message 
        });
    }
});

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Récupère un books
 *     description: Permet de Récupèrer unn seul livres
 *     responses:
 *       200:
 *         description: Succès - Liste des livres
 */
app.get('/books/:id', async (req, res) => {
    Books.findOne({_id: req.params.id})
        .then(thing => res.status(201).json(thing))
        .catch(error => res.status(404).json({ error }))
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Le serveur tourne sur le port ${PORT}`));
