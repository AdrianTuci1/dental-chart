import React from 'react';
import MyProfile from '../../MyProfile';

const ProfileView = ({ userProfile, onProfileRefresh, onClose }) => (
    <MyProfile initialProfile={userProfile} onProfileRefresh={onProfileRefresh} onClose={onClose} />
);

export default ProfileView;
