const { User, Infosimulation, Nbsimulation} = require(`../models`);

const coefFoyer = require (`../middlewares/coefFoyer`);
const eligibiliteAAH = require (`../middlewares/eligibiliteAAH`);
const eligibiliteMVA = require (`../middlewares/eligibiliteMVA`);
const assiette = require (`../middlewares/assiette`);
const revenusTotalEnfants = require (`../middlewares/revenusDesEnfants`);
const montantAAHPercu = require (`../middlewares/montantAAHPercu`);
const eligibiliteFoyer = require (`../middlewares/eligibiliteFoyer`);
const montantPercuAAHAvecMVA = require (`../middlewares/montantMVAPercu`);
const statusAAH = require("../middlewares/statusAAH");
const phraseFin = require("../middlewares/phraseFin");
const boolean = require("../middlewares/boolean");
const abattementConjoint = require("../middlewares/abattementConjoint");

  // liste touters les infosimulation de l'utilisateur
  exports.getInfosimulationsUser = async (req, res) => {
    const userId = userToken.id
    await User.findAndCountAll( { 
      where: id = userId,
      include:[model = 'infosimulation', ],
      order:[[ model = 'infosimulation',"updated_at", "DESC",]],
    }).then((user) => {   
      if(!user) {
        throw new Error(`Utilisateur non trouvé`);
      }   
      res.status(200).json({
        success: true,
        message:(`Voici la liste de toutes les simulations de l'utilisateur`),
        user
      });
    }).catch(error => {
      console.trace(error);
      res.status(500).json({
        success: false,
        message:(`Oups il y a un problème avec la liste des simulations de l'utilisateur`),
        error: error.message
      });
    });           
  };

  // Affiche une simulation de l'utilisateur
  exports.getInfosimulationUser = async (req, res) => {
    const userId = userToken.id
    const infosimulationId = Number(req.params.infosimulationId, 10);  
    await Promise.all([
      User.findByPk(userId),
      Infosimulation.findByPk(infosimulationId)
    ]).then(values => {
      [user, infosimulation] = values;
      if(!user) {
        throw new Error(`Utilisateur non trouvé`);
      }
      if(!infosimulation) {
        throw new Error(`Information de votre simulation non trouvé`);
      }
      if(infosimulation.user_id !== user.id) {
        throw new Error(`Revenus de l'utilisateur non trouvés`);
      }
      return (user, infosimulation);
    }).then(() => {
      res.status(200).json({
        success: true,
        message:(`affiche le revenu de l'utilisateur`),
        infosimulation
      });
    }).catch(error => {
      console.trace(error);
      res.status(500).json({
        success: false,
        message:(`Oups il y a un problème avec la simulation de l'utilisateur`),
        error: error.message
      });
    });
  };

  // création d'une simulation pour l'utilisatuer
  exports.createInfosimulationUser = async (req, res) => {

    const userId = userToken.id
    //const userId = 6
    //const nbsimulationId = Number(req.params.nbsimulationId, 10);

    const {
      year, 
      household_composition,
      nb_child,
      place_of_residence, 
      apl,
      applicant_age, 
      spouse_age, 
    } = req.body;
    let missingParams =[];
    if (!year) {
      missingParams.push(`l'année'`);
    }
    if (!household_composition) {
      missingParams.push(`votre situation`);
    }
    //if (!place_of_residence) {
    //  missingParams.push(`le lieu de résidence`);
    //}
    //if (!apl) {
    //  missingParams.push(`des apl`);
    //}
    //if (!applicant_age) {
    //  missingParams.push(`l'age du demandeur`);
    //}
    //if (!spouse_age) {
    //  missingParams.push(`l'age du conjoint`);
    //}
    if (missingParams.length > 0) {
      return res.status(400).json(`Il manque des paramètres: ${missingParams.join(`, `)}`);
    }

    const coefDuFoyer = coefFoyer(
      req.body.household_composition,
      req.body.majorationPlafonCouple,
      req.body.nb_child,
      req.body.coefPersonneACharge,
    );

    const aahPlafondRessourcesMois = coefDuFoyer * req.body.aah_amount;

    const eligibiliteAAHDemandeur = eligibiliteAAH(
      boolean(req.body.applicant_disability),
      Number(req.body.applicant_age),
      Number(req.body.ageMinimal),
      Number(req.body.ageRetraite),
      Number(req.body.applicant_disability_rate),
      Number(req.body.disability_rate_mini),
      boolean(req.body.place_of_residence)
    );
    // console.log('eligibiliteAAHDemandeur', eligibiliteAAHDemandeur);
    
    const eligibiliteAAHConjoint = eligibiliteAAH(
      boolean(req.body.spouse_disability),
      Number(req.body.spouse_age),
      Number(req.body.ageMinimal),
      Number(req.body.ageRetraite),
      Number(req.body.spouse_disability_rate),
      Number(req.body.disability_rate_mini),
      boolean(req.body.place_of_residence)
    );
    //  console.log('eligibiliteAAHConjoint', eligibiliteAAHConjoint);

    const aplBoolean = boolean(req.body.apl);  
      //console.log('Boolean test', aplBoolean);

    const abattement2022 = abattementConjoint(
      req.body.nb_child,
    )
    console.log('abattement2022', abattement2022);

    const eligibiliteMVADemandeur = eligibiliteMVA(
      boolean(req.body.apl),
      Number(req.body.applicant_disability_rate),
      Number(req.body.disability_rate_max),
      Number(req.body.applicant_income_with_activity),
    ); 

    // console.log('eligibiliteMVADemandeur', eligibiliteMVADemandeur);

    const eligibiliteMVAConjoint = eligibiliteMVA(
      boolean(req.body.apl),
      Number(req.body.spouse_disability_rate),
      Number(req.body.disability_rate_max),
      Number(req.body.spouse_income_with_activity),
    ); 

    // console.log('eligibiliteMVAConjoint', eligibiliteMVAConjoint);
    
    const assietteDemandeur = assiette(
      boolean(req.body.applicant_disability),
      Number(req.body.smichb),
      Number(req.body.smicnbtf),
      Number(req.body.applicant_income_with_activity),
      Number(req.body.applicant_income_without_activity),
      req.body.nb_child,
      abattement2022
    ); 
    
    const assietteConjoint = assiette(
      boolean(req.body.spouse_disability),
      Number(req.body.smichb),
      Number(req.body.smicnbtf),
      Number(req.body.spouse_income_with_activity),
      Number(req.body.spouse_income_without_activity),
      req.body.nb_child,
      abattement2022
    ); 
    // console.log('assietteConjoint', assietteConjoint);

    const revenusDesEnfants = revenusTotalEnfants(
      req.body.nb_child,
      Number(req.body.child_income1),
      Number(req.body.child_income2),
      Number(req.body.child_income3),
      Number(req.body.child_income4),
      Number(req.body.child_income5) 
    );

    const assietteEnfant = assiette(
      true,
      Number(req.body.smichb),
      Number(req.body.smicnbtf),
      revenusDesEnfants,
    ); 

    const assietteTotalFoyerAnnuel = 
      assietteDemandeur +
      assietteConjoint +
      assietteEnfant;

    const eligibiliteAAHallFoyer = eligibiliteFoyer(
      eligibiliteAAHConjoint,
      eligibiliteAAHDemandeur
    );

    const eligibiliteMVAallFoyer = eligibiliteFoyer(
      eligibiliteMVAConjoint,
      eligibiliteMVADemandeur
    );

    const aahMontantSurAssietteAnnuel = (aahPlafondRessourcesMois*12);
    const aahMax =  Math.round((aahMontantSurAssietteAnnuel - assietteTotalFoyerAnnuel)/12);

    const montantAAHSansMVA = montantAAHPercu(
      eligibiliteAAHallFoyer,
      aahMax,
      req.body.aah_amount,
    );

    const montantAAHAvecMVA = montantPercuAAHAvecMVA(
      eligibiliteMVAallFoyer,
      montantAAHSansMVA,
      req.body.aah_amount,
      req.body.mva_amount,
    );

    const statusFinalAAH = statusAAH(
      req.body.household_composition,
      req.body.nb_child,
      eligibiliteAAHallFoyer,
      eligibiliteMVAallFoyer,
      coefDuFoyer,
      aahPlafondRessourcesMois,
      req.body.year,
      req.body.applicant_income_without_activity,
      req.body.applicant_income_with_activity,
      req.body.spouse_income_without_activity,
      req.body.spouse_income_with_activity,
      revenusDesEnfants,
      req.body.aah_amount,
      montantAAHAvecMVA,
    );

    const statusSimple = phraseFin(
      req.body.aah_amount,
      montantAAHAvecMVA,
    );
    console.log('statusSimple', statusSimple);

    const newInfosimulation = {
    // Data => ok
      year: req.body.year,
      aah_amount:req.body.aah_amount.toFixed(2),
      mva_amount:req.body.mva_amount.toFixed(2),
      smichb:req.body.smichb.toFixed(2),
      smicnbtf:req.body.smicnbtf.toFixed(2),
      ageMinimal:req.body.ageMinimal,
      ageRetraite: req.body.ageRetraite,
      disability_rate_mini: req.body.disability_rate_mini.toFixed(2),
      disability_rate_max: req.body.disability_rate_max.toFixed(2),
      majorationPlafonCouple: req.body.majorationPlafonCouple,
      coefPersonneACharge: req.body.coefPersonneACharge,
    // Info du foyer
      household_composition: req.body.household_composition,
      nb_child: req.body.nb_child,
      place_of_residence: boolean(req.body.place_of_residence),
      apl: boolean(req.body.apl),
    // le demandeur
      applicant_age: req.body.applicant_age,
      applicant_disability: boolean(req.body.applicant_disability),
      applicant_disability_rate: req.body.applicant_disability_rate,
      applicant_income_without_activity: req.body.applicant_income_without_activity,
      applicant_income_with_activity: req.body.applicant_income_with_activity,
      applicant_eligibility_aah: eligibiliteAAHDemandeur,
      applicant_eligibility_mva: eligibiliteMVADemandeur,
    // le conjoint
      spouse_age: req.body.spouse_age,
      spouse_disability: req.body.spouse_disability,
      spouse_disability_rate: req.body.spouse_disability_rate,
      spouse_income_without_activity: req.body.spouse_income_without_activity,
      spouse_income_with_activity: req.body.spouse_income_with_activity,
      spouse_eligibility_aah: eligibiliteAAHConjoint,
      spouse_eligibility_mva: eligibiliteMVAConjoint,
    // les enfants
      child_income1: req.body.child_income1,
      child_income2: req.body.child_income2,
      child_income3: req.body.child_income3,
      child_income4: req.body.child_income4,
      child_income5: req.body.child_income5,
    // Les resultats
      coef_foyer: coefDuFoyer,
      plafond_foyer_annuel: (aahPlafondRessourcesMois*12).toFixed(2),
      plafond_foyer_mensuel: aahPlafondRessourcesMois.toFixed(2),
      eligibilite_aah_foyer: eligibiliteAAHallFoyer,
      eligibilite_mva_foyer: eligibiliteMVAallFoyer,
      abattement2022: abattement2022,
      assiette_demandeur: assietteDemandeur.toFixed(2) ,
      assiette_conjoint: assietteConjoint.toFixed(2) ,
      assiette_enfant: assietteEnfant.toFixed(2),
      assiette_total: assietteTotalFoyerAnnuel.toFixed(2),
      aah_max: aahMax.toFixed(2),
      montant_aah_sans_mva_mensuel: montantAAHSansMVA.toFixed(2),
      montant_aah_avec_mva_mensuel: montantAAHAvecMVA.toFixed(2),
      status_aah: statusFinalAAH,
      status_simple : statusSimple,
      user_id: userId
    };

    const nbsimulation = {
      content: `Un utilisateur a fait une simulation`,
      user_id: userId
    };

   // console.log('req.body', req.body.apl);
    //console.log(' newInfosimulation',  newInfosimulation);

    await Promise.all([
      User.findByPk(userId),    
      Infosimulation.create(newInfosimulation),
      Nbsimulation.create(nbsimulation),
    ]).then(infosimulation => {
      res.status(201).json({
        success: true,
        message: (`Simulation créée`),
        infosimulation,
      });
    }).catch(error => {
      console.trace(error);
      res.status(500).json({
        success: false,
        message:(`Oups, la simulation n'a pas été effectuée`),
        error: error.message
      });
    });
  };

  // suppression d'une simulation de l'utilisateur
  exports.deleteInfosimulationUser = async (req, res) => {
    const userId = userToken.id
    const infosimulationId = Number(req.params.infosimulationId, 10);
    await Promise.all([
      User.findByPk(userId),
      Infosimulation.findByPk(infosimulationId)
    ]).then(values => {
      [user, infosimulation] = values;
      if(!user) {
        throw new Error(`Utilisateur non trouvé`);
      }
      if(!infosimulation) {
        throw new Error(`Simulation non trouvée`);
      }
      if(infosimulation.user_id !== userId) {
        throw new Error(`Simulation de l'utilisateur non trouvée`);
      }
      return infosimulation.destroy();
    }).then(() => {
      res.status(200).json({
        success: true,
        message: (`Simulation effacée`)
      });
    }).catch(error => {
      console.trace(error);
      res.status(500).json({
        success: false,
        message: (`La simulation n'a pas été effacée`),
        error: error.message
      });
    });
  };

  // compteur de simulations
  exports.getCountInfosimulations = async (req, res) => {
    await Infosimulation.count().then(infosimulations => {
      res.status(200).json({
        success: true,
        essage: (`Voici le nombre total de revenus => ${infosimulations}`),
        infosimulations
      });
    }).catch(error => {
      console.trace(error);
      res.status(500).json({
        success: false,
        message: (`Impossible de compter le nombre de revenus`),
        error: error.message
      });
    });
  };
