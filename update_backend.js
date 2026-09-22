const fs = require('fs');
const path = require('path');

const entities = [
  { name: 'Municipality', camel: 'municipality', route: 'municipality' },
  { name: 'Ward', camel: 'ward', route: 'ward' },
  { name: 'Area', camel: 'area', route: 'area' },
  { name: 'Department', camel: 'department', route: 'department' },
  { name: 'Designation', camel: 'designation', route: 'designation' },
  { name: 'Employee', camel: 'employee', route: 'employee' },
  { name: 'WorkerTeam', camel: 'workerTeam', route: 'workerTeam' }
];

const basePath = 'd:/Smart Municipal Management Platform/server/src';

entities.forEach(ent => {
  // 1. Update Service
  const servicePath = path.join(basePath, 'services', \.service.js);
  if (fs.existsSync(servicePath)) {
    let content = fs.readFileSync(servicePath, 'utf8');
    if (!content.includes(export const delete\)) {
      content += \n\nexport const delete\ = async (id) => {\n  return await \.findByIdAndDelete(id);\n};\n;
      fs.writeFileSync(servicePath, content);
      console.log(Updated \);
    }
  }

  // 2. Update Controller
  const controllerPath = path.join(basePath, 'controllers', \.controller.js);
  if (fs.existsSync(controllerPath)) {
    let content = fs.readFileSync(controllerPath, 'utf8');
    if (!content.includes(export const delete\)) {
      content += \n\nexport const delete\ = async (req, res) => {\n  try {\n    const \ = await \Service.delete\(req.params.id);\n    if (!\) {\n      return res.status(404).json({ success: false, message: '\ not found' });\n    }\n    res.status(200).json({ success: true, message: '\ deleted successfully' });\n  } catch (error) {\n    res.status(400).json({ success: false, message: error.message });\n  }\n};\n;
      fs.writeFileSync(controllerPath, content);
      console.log(Updated \);
    }
  }

  // 3. Update Routes
  const routePath = path.join(basePath, 'routes', \.routes.js);
  if (fs.existsSync(routePath)) {
    let content = fs.readFileSync(routePath, 'utf8');
    if (!content.includes(delete\)) {
      // Find the last authorizeRoles or similar and insert
      // A safe way is to replace the export default router with the new route + export default router
      content = content.replace('export default router;', outer.delete('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), \Controller.delete\);\n\nexport default router;);
      fs.writeFileSync(routePath, content);
      console.log(Updated \);
    }
  }
});
