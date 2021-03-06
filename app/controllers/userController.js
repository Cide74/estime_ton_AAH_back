const { User } = require(`../models`);
const {generateAccessToken,generateRefreshToken }= require(`../middlewares/jwt`);
const bcrypt = require("bcrypt");

//* Affiche un utilisateur avec ses infos
exports.getUser = async (req, res) => {
  const userId = userToken.id
  await User.findAll( { 
    where: id = userId,
    }).then((user) => {
      if (!user) {
        throw new Error(`Utilisateur non trouvé`);
      }
      res.status(200).json({
        success: true,
        message: `Toutes les informations de l'utilisateur`,
        user
      });
    })
    .catch((error) => {
      console.trace(error);
      res.status(500).json({
        success: false,
        message: `Oups il y a un problème avec les informations de l'utilisateur, veuillez vous connecter.`,
        error: error.message,
      });
    });
};

//* Affiche un utilisateur avec ses 10 dernier commentaires
exports.getUserLastComment = async (req, res) => {
  const userId = userToken.id
  await User.findAndCountAll( { 
    where: id = userId,
    include: [model = 'comment'], 
    order: [[ model = 'comment',"updated_at", "DESC",]],
    limit:10,
    subQuery: false,
  }).then((user) => {
      if (!user) {
        throw new Error(`Utilisateur non trouvé`);
      }
      res.status(200).json({
        success: true,
        message: `Les 10 derniers commentaires`,
        user,
      });
    })
    .catch((error) => {
      console.trace(error);
      res.status(500).json({
        success: false,
        message: `Oups il y a un problème avec les 10 derniers commentaires de l'utilisateur, veuillez vous connecter.`,
        error: error.message,
      });
    });
};

//* liste un utilisateur avec ses 10 derniers articles
exports.getUserLastArticle = async (req, res) => {
  const userId = userToken.id
  await User.findAndCountAll( { 
    where: id = userId,
    include: [model = 'article'], 
    order: [[ model = 'article',"updated_at", "DESC",]],

    limit:10,
    subQuery: false,
  }).then((user) => {
      if (!user) {
        throw new Error(`Utilisateur non trouvé`);
      }
      res.status(200).json({
        success: true,
        message: `Les 10 derniers articles`,
        user,
      });
    })
    .catch((error) => {
      console.trace(error);
      res.status(500).json({
        success: false,
        message: `Oups, il y a un problème avec les 10 derniers articles de l'utilisateur, veuillez vous connecter.`,
        error: error.message,
      });
    });
};

//* affiche un utilisateur avec ses 10 dernier message du livre d'or
exports.getUserLastGuestbook = async (req, res) => {
  const userId = userToken.id
  await User.findAndCountAll( { 
    where: id = userId,
    include: [model = 'guestbook'], 
    order: [[ model = 'guestbook',"updated_at", "DESC",]],
    limit:10,
    subQuery: false,
  }).then((user) => {
      if (!user) {
        throw new Error(`Utilisateur non trouvé`);
      }
      res.status(200).json({
        success: true,
        message: `Les 10 derniers messages du livre d'or`,
        user,
      });
    })
    .catch((error) => {
      console.trace(error);
      res.status(500).json({
        success: false,
        message: `Oups il y a un problème avec les 10 derniers messages du livre d'or, veuillez vous connecter.`,
        error: error.message,
      });
    });
};

//* liste un utilisateur avec ses 10 dernières informations de simulations
exports.getUserLastInfosimulation = async (req, res) => {
  const userId = userToken.id
  await User.findAndCountAll( { 
    where: id = userId,
    include: [model = 'infosimulation'], 
    order: [[ model = 'infosimulation',"updated_at", "DESC",]],
    limit:10,
    subQuery: false,
  }).then((user) => {
      if (!user) {
        throw new Error(`Utilisateur non trouvé`);
      }
      res.status(200).json({
        success: true,
        message: `Les 10 dernières simulations`,
        user,
      });
    })
    .catch((error) => {
      console.trace(error);
      res.status(500).json({
        success: false,
        message: `Oups il y a un problème avec les 10 dernières simulations de l'utilisateur, veuillez vous connecter.`,
        error: error.message,
      });
    });
};

//* création d'un utilisateur
exports.createUser = async (req, res) => {
  const { pseudo, email, password, role} = req.body;
  let missingParams = [];
  if (!pseudo) {
    missingParams.push(`Votre pseudo`);
  }
  if (!role) {
    missingParams.push(`role`);
  }
  if (!email) {
    missingParams.push(`Votre email`);
  }
  if (!password) {
    missingParams.push(`Votre mot de passe`);
  }
  if (missingParams.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Il manque des parametres: ${missingParams.join(`, `)}`,
    });
  }
  try {
    const userExist = await User.findOne({
      where: { pseudo: pseudo },
    });
    if (userExist) {
      // 409 conflit
      return res.status(409).json({
        success: false,
        message: `Pseudo déja existant !`,
      });
    }
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = {
      pseudo: req.body.pseudo,
      password: hashPassword,
      email: req.body.email,
      author: req.body.author,
      role: req.body.role,
    };

    const newUserWOPW = {
      pseudo: req.body.pseudo,
      email: req.body.email,
      author: req.body.author,
      role: req.body.role,
    };

    await User.create(newUser);
    res.status(200).json({
      success: true,
      message: `Tout s'est bien passé, l'utilisateur à bien été crée avec le pseudo ${pseudo}`,
      newUserWOPW
    });
  } catch (error) {
    console.trace(error);
    res.status(400).json({
      success: false,
      message: `Oups il y a un problème avec le pseudo ${pseudo}`,
      error: error.message,
    });
  }
};

//* Mise à jour d'un utilisateur
exports.updateUser = async (req, res) => {
  const userId = userToken.id
  if (userToken.pseudo !== req.body.pseudo ) {
    const userExist = await User.findOne({
      where: { pseudo: req.body.pseudo },
    });
    if (userExist) {
      // 409 conflit
      return res.status(409).json({
        success: false,
        message: `Le pseudo ${req.body.pseudo} est déja existant !`,
      });
    }
  }
  const hashPassword = await bcrypt.hash(req.body.password, 10);
  const userData = {
    pseudo: req.body.pseudo,
    password: hashPassword,
    email: req.body.email,
    author: req.body.author,
    role: req.body.role,
  };
  //* je récupère le user à modifier
  await User.findByPk(userId)
    .then((user) => {
      return user.update(userData);
    })
    .then((user) => {
      // lorsque le mise à jours est terminée je renvoie au client le user modifié
      const userWOPW = {
      pseudo: user.dataValues.pseudo,
      email: user.dataValues.email,
      author: user.dataValues.author,
      role: user.dataValues.role,
      };
    const accessToken = generateAccessToken(userWOPW);
    const refreshToken = generateRefreshToken(userWOPW);
      res.status(200).json({
        success: true,
        message: `Utilisateur mis à jour`,
        userWOPW,
        accessToken,
        refreshToken
      });
    })
    .catch((error) => {
      console.trace(error);
      // si sequelize a eu une erreur je renvoie un message au client en JSON pour lui dire qu`il y a un pépin
      res.status(500).json({
        success: false,
        message: `L'utilisateur n'a pas été mis à jour`,
        error: error.message,
      });
    });
};

//* Suppression de l'utilisateur
exports.deleteUser = async (req, res) => {
  const userId = userToken.id
  await User.findByPk(userId)
    .then((user) => {
      return user.destroy();
    })
    .then(() => {
      res.status(200).json({
        success: true,
        message: `L'utilisateur a été effacé`,
      });
    })
    .catch((error) => {
      console.trace(error);
      res.status(500).json({
        success: false,
        message: `L'utilisateur n'a pas été effacé`,
        error: error.message,
      });
    });
};

//* compteur du nombre d'utilisateurs enregistés
exports.getCountUsers = async (req, res) => {
  await User.count()
    .then((users) => {
      res.status(200).json({
        success: true,
        message: `Voici le nombre total d'utilisateurs => ${users}`,
        users,
      });
    })
    .catch((error) => {
      console.trace(error);
      res.status(500).json({
        success: false,
        message: `Impossible de compter le nombre d'utilisateurs`,
        error: error.message,
      });
    });
};

//* pour login user
exports.loginUser = async (req, res) => {
  try {
    const {password , pseudo} = req.body;
    let missingParams =[];
    if (!pseudo) {
      missingParams.push(`pseudo`);
    }
    if (!password) {
      missingParams.push(`mot de passe`);
    }
    if (missingParams.length > 0) {
      return res.status(400).json({
        sucess: false,
        message:`Il manque votre ${missingParams.join(` et le `)}`});
    }
    const logUser = await User.findOne({
      where: { pseudo }
    });
    if (!logUser) {
      return res.status(401).json({
        success: false,
        message: `L'utilisateur n'existe pas !`,
      });
    }
    userInfo = logUser.dataValues;
    validPwd = await bcrypt.compare(password, userInfo.password );
      if (!validPwd) {
        return res.status(401).json({
          success: false,
          message: 'Le mot de passe est invalide !',
        });
      }
    const userLog = {
      id: userInfo.id,
      pseudo: userInfo.pseudo,
      email: userInfo.email,
      author: userInfo.author,
      role: userInfo.role,
    };
    const accessToken = generateAccessToken(userLog);
    const refreshToken = generateRefreshToken(userLog);
    res.status(200).json({
      success: true,
      message: `Bienvenue ${userInfo.pseudo}`,
      userInfo,
      accessToken,
      refreshToken
    });
  } catch (error) {
      console.trace(error);
      res.status(500).json({
        success: false,
        message: `Données non trouvées !`,
        error: error.message,
      });
  }
};