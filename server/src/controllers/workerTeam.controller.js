import * as workerTeamService from '../services/workerTeam.service.js';
import Profile from '../models/Profile.js';
import WorkerTeam from '../models/WorkerTeam.js';

const getUserMunicipalityId = async (userId) => {
  const profile = await Profile.findOne({ userId });
  return profile ? profile.municipalityId : null;
};

export const createWorkerTeam = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { municipalityId } = req.body;

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (!myMunicipalityId || myMunicipalityId.toString() !== municipalityId) {
        return res.status(403).json({ success: false, message: 'You can only create teams for your own municipality' });
      }
    }

    const team = await workerTeamService.createWorkerTeam(req.body);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Team code already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getWorkerTeams = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const query = { ...req.query };
    
    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (!myMunicipalityId) {
        return res.status(403).json({ success: false, message: 'You are not assigned to a municipality' });
      }
      query.municipalityId = myMunicipalityId;
    }

    const result = await workerTeamService.getWorkerTeams(query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWorkerTeamById = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const team = await workerTeamService.getWorkerTeamById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && team.municipalityId && team.municipalityId._id.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this team' });
      }
    }
    
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWorkerTeam = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const existingTeam = await WorkerTeam.findById(req.params.id);
    if (!existingTeam) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && existingTeam.municipalityId.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this team' });
      }
      if (req.body.municipalityId && req.body.municipalityId !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot move team to another municipality' });
      }
    }
    
    const team = await workerTeamService.updateWorkerTeam(req.params.id, req.body);
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Team code already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateWorkerTeamStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }
    
    const { role, _id } = req.user;
    const existingTeam = await WorkerTeam.findById(req.params.id);
    if (!existingTeam) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && existingTeam.municipalityId.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this team' });
      }
    }

    const team = await workerTeamService.updateWorkerTeamStatus(req.params.id, isActive);
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const deleteWorkerTeam = async (req, res) => {
  try {
    const workerTeam = await workerTeamService.deleteWorkerTeam(req.params.id);
    if (!workerTeam) {
      return res.status(404).json({ success: false, message: 'WorkerTeam not found' });
    }
    res.status(200).json({ success: true, message: 'WorkerTeam deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

