import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function Dashboard({user}){
    return(
        <h2>Welcome {user.username} </h2>    
    );
}

export default Dashboard;