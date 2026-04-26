import React from 'react';
import MyProfile from '../../MyProfile';

const ProfileView = ({ userProfile, onProfileRefresh }) => (
    <MyProfile initialProfile={userProfile} onProfileRefresh={onProfileRefresh} />
);

export default ProfileView;
