import User from '../models/model.js';
import Project from '../models/Project.js';

// Find common interests between student and faculty
const findCommonInterests = (studentInterests, facultyInterests) => {
  const normalizedStudentInterests = studentInterests.map(interest => 
    interest.toLowerCase().trim()
  );
  
  const normalizedFacultyInterests = facultyInterests.map(interest => 
    interest.toLowerCase().trim()
  );
  
  const commonInterests = [];
  
  studentInterests.forEach(studentInterest => {
    const normalizedStudent = studentInterest.toLowerCase().trim();
    facultyInterests.forEach(facultyInterest => {
      const normalizedFaculty = facultyInterest.toLowerCase().trim();
      if (normalizedStudent === normalizedFaculty) {
        commonInterests.push(studentInterest);
      }
    });
  });
  
  return commonInterests;
};

// Get faculty-student matching suggestions
export const getFacultyStudentMatches = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query;
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let matches = [];
    
    if (role === 'student' || user.role === 'student') {
      // Student requesting faculty matches
      const student = user;
      
      if (!student.academicInterests || student.academicInterests.length === 0) {
        return res.json({
          matches: [],
          message: 'Please add academic interests to your profile to get faculty recommendations'
        });
      }
      
      // Get all faculty members with academic interests
      const facultyMembers = await User.find({ 
        role: 'faculty',
        academicInterests: { $exists: true, $ne: [] }
      });
      
      // Find faculty with matching interests
      matches = facultyMembers
        .map(faculty => {
          const commonInterests = findCommonInterests(
            student.academicInterests,
            faculty.academicInterests || []
          );
          
          if (commonInterests.length === 0) return null;
          
          return {
            faculty: {
              _id: faculty._id,
              name: faculty.name,
              email: faculty.email,
              department: faculty.department,
              institution: faculty.institution,
              academicInterests: faculty.academicInterests,
              profilePhoto: faculty.profilePhoto
            },
            commonInterests
          };
        })
        .filter(match => match !== null) // Only show matches with common interests
        .sort((a, b) => b.commonInterests.length - a.commonInterests.length) // Sort by number of common interests
        .slice(0, 20); // Show more matches since filtering is stricter
        
    } else if (role === 'faculty' || user.role === 'faculty') {
      // Faculty requesting student matches
      const faculty = user;
      
      if (!faculty.academicInterests || faculty.academicInterests.length === 0) {
        return res.json({
          matches: [],
          message: 'Please add academic interests to your profile to get student recommendations'
        });
      }
      
      // Get all students with academic interests
      const students = await User.find({ 
        role: 'student',
        academicInterests: { $exists: true, $ne: [] }
      });
      
      // Find students with matching interests
      matches = students
        .map(student => {
          const commonInterests = findCommonInterests(
            student.academicInterests,
            faculty.academicInterests || []
          );
          
          if (commonInterests.length === 0) return null;
          
          return {
            student: {
              _id: student._id,
              name: student.name,
              email: student.email,
              department: student.department,
              institution: student.institution,
              program: student.program,
              cgpa: student.cgpa,
              academicInterests: student.academicInterests,
              profilePhoto: student.profilePhoto
            },
            commonInterests
          };
        })
        .filter(match => match !== null) // Only show matches with common interests
        .sort((a, b) => b.commonInterests.length - a.commonInterests.length) // Sort by number of common interests
        .slice(0, 20); // Show more matches since filtering is stricter
    }
    
    res.json({
      matches,
      totalMatches: matches.length,
      userRole: user.role
    });
    
  } catch (error) {
    console.error('Error getting matches:', error);
    res.status(500).json({ message: 'Server error getting matches' });
  }
};

// Get detailed match analysis
export const getMatchAnalysis = async (req, res) => {
  try {
    const { userId, targetId } = req.params;
    
    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    
    if (!user || !target) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let analysis = {};
    
    if (user.role === 'student' && target.role === 'faculty') {
      const commonInterests = findCommonInterests(
        user.academicInterests || [],
        target.academicInterests || []
      );
      
      analysis = {
        commonInterests,
        hasMatch: commonInterests.length > 0,
        matchCount: commonInterests.length,
        recommendations: commonInterests.length > 0 ? 
          'You have matching academic interests! Consider reaching out for collaboration.' :
          'No matching interests found. You may want to explore other faculty members.'
      };
    }
    
    res.json(analysis);
    
  } catch (error) {
    console.error('Error getting match analysis:', error);
    res.status(500).json({ message: 'Server error getting match analysis' });
  }
};
