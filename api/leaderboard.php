<?php
/**
 * Leaderboard API endpoints
 */

switch ($requestMethod) {
    case 'GET':
        handleGetLeaderboard($pdo);
        break;
        
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function handleGetLeaderboard($pdo) {
    $filter = $_GET['filter'] ?? 'global';
    $limit = min((int)($_GET['limit'] ?? 50), 100); // Max 100 entries
    $offset = max((int)($_GET['offset'] ?? 0), 0);
    
    $sql = "
        SELECT 
            u.id,
            u.name,
            u.email,
            up.total_xp,
            up.level,
            up.level_title,
            up.streak,
            us.challenges_completed,
            us.projects_created,
            COUNT(ua.id) as total_achievements,
            ROW_NUMBER() OVER (ORDER BY up.total_xp DESC) as rank_position
        FROM users u
        LEFT JOIN user_progress up ON u.id = up.user_id
        LEFT JOIN user_statistics us ON u.id = us.user_id
        LEFT JOIN user_achievements ua ON u.id = ua.user_id
    ";
    
    $params = [];
    
    // Add filters based on type
    switch ($filter) {
        case 'weekly':
            $sql .= " WHERE up.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            break;
            
        case 'monthly':
            $sql .= " WHERE up.last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            break;
            
        case 'html':
            $sql .= " WHERE us.html_xp > 0";
            break;
            
        case 'css':
            $sql .= " WHERE us.css_xp > 0";
            break;
            
        case 'javascript':
            $sql .= " WHERE us.javascript_xp > 0";
            break;
            
        case 'challenges':
            $sql .= " WHERE us.challenges_completed > 0";
            break;
            
        case 'games':
            $sql .= " WHERE us.games_played > 0";
            break;
    }
    
    $sql .= "
        GROUP BY u.id, u.name, u.email, up.total_xp, up.level, up.level_title, 
                 up.streak, us.challenges_completed, us.projects_created
        ORDER BY up.total_xp DESC
        LIMIT ? OFFSET ?
    ";
    
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $leaderboard = $stmt->fetchAll();
    
    // Format the response
    $formattedLeaderboard = array_map(function($entry, $index) use ($offset) {
        return [
            'rank' => $offset + $index + 1,
            'userId' => $entry['id'],
            'username' => $entry['name'],
            'email' => $entry['email'],
            'totalXP' => (int)$entry['total_xp'],
            'level' => (int)$entry['level'],
            'levelTitle' => $entry['level_title'],
            'streak' => (int)$entry['streak'],
            'challengesCompleted' => (int)$entry['challenges_completed'],
            'projectsCreated' => (int)$entry['projects_created'],
            'totalAchievements' => (int)$entry['total_achievements']
        ];
    }, $leaderboard, array_keys($leaderboard));
    
    // Get user's position if authenticated
    $userPosition = null;
    $user = getAuthenticatedUser($pdo);
    
    if ($user) {
        $stmt = $pdo->prepare("
            SELECT rank_position 
            FROM user_leaderboard 
            WHERE id = ?
        ");
        $stmt->execute([$user['id']]);
        $userRank = $stmt->fetchColumn();
        
        if ($userRank) {
            $userPosition = (int)$userRank;
        }
    }
    
    // Get total count for pagination
    $countSql = "
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        LEFT JOIN user_progress up ON u.id = up.user_id
        LEFT JOIN user_statistics us ON u.id = us.user_id
    ";
    
    // Apply same filters for count
    switch ($filter) {
        case 'weekly':
            $countSql .= " WHERE up.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            break;
        case 'monthly':
            $countSql .= " WHERE up.last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            break;
        case 'html':
            $countSql .= " WHERE us.html_xp > 0";
            break;
        case 'css':
            $countSql .= " WHERE us.css_xp > 0";
            break;
        case 'javascript':
            $countSql .= " WHERE us.javascript_xp > 0";
            break;
        case 'challenges':
            $countSql .= " WHERE us.challenges_completed > 0";
            break;
        case 'games':
            $countSql .= " WHERE us.games_played > 0";
            break;
    }
    
    $stmt = $pdo->prepare($countSql);
    $stmt->execute();
    $totalCount = (int)$stmt->fetchColumn();
    
    sendResponse([
        'success' => true,
        'data' => [
            'leaderboard' => $formattedLeaderboard,
            'userPosition' => $userPosition,
            'pagination' => [
                'total' => $totalCount,
                'limit' => $limit,
                'offset' => $offset,
                'hasMore' => ($offset + $limit) < $totalCount
            ],
            'filter' => $filter
        ]
    ]);
}
?>