import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [
    {
      id: 'MC-2044',
      title: 'Open drain overflowing near school',
      ward: 'Ward 9',
      category: 'Drainage',
      status: 'submitted',
      priority: 'urgent',
      isCitizenOwn: false,
    },
    {
      id: 'MC-2041',
      title: 'Streetlight not working',
      ward: 'Ward 12',
      category: 'Streetlight',
      status: 'in-progress',
      priority: 'normal',
      isCitizenOwn: true,
    },
    {
      id: 'MC-2038',
      title: 'Garbage not collected for 4 days',
      ward: 'Ward 7',
      category: 'Garbage',
      status: 'submitted',
      priority: 'normal',
      isCitizenOwn: true,
    },
    {
      id: 'MC-2036',
      title: 'Deep pothole at market junction',
      ward: 'Ward 5',
      category: 'Road and potholes',
      status: 'in-progress',
      priority: 'urgent',
      isCitizenOwn: false,
    },
    {
      id: 'MC-2029',
      title: 'Water pipe leaking on main road',
      ward: 'Ward 3',
      category: 'Water supply',
      status: 'resolved',
      priority: 'normal',
      isCitizenOwn: true,
    },
  ],
  nextId: 2045,
};

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {
    addComplaint: (state, action) => {
      const { title, category, location, description } = action.payload;
      const id = `MC-${state.nextId}`;
      state.items.unshift({
        id,
        title,
        ward: location,
        category,
        status: 'submitted',
        priority: 'normal',
        description,
        isCitizenOwn: true,
      });
      state.nextId += 1;
    },
    updateStatus: (state, action) => {
      const { id, status } = action.payload;
      const complaint = state.items.find((c) => c.id === id);
      if (complaint) {
        complaint.status = status;
      }
    },
  },
});

export const { addComplaint, updateStatus } = complaintsSlice.actions;
export default complaintsSlice.reducer;
