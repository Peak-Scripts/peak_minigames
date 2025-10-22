local inMinigame = false
local callback = nil

---@param cb function
---@param gameName string
---@param gameSettings table
---@return boolean
local function startMinigame(cb, gameName, gameSettings)
    if inMinigame then 
        return false 
    end

    SendNUIMessage({
        action = 'startMinigame',
        data = {
            minigame = gameName,
            config = gameSettings
        }
    })
    
    SetNuiFocus(true, true)

    inMinigame = true
    callback = cb
    
    return true
end

---@param data table
---@param cb function
RegisterNUICallback('minigameComplete', function(data, cb)
    if callback then
        callback(data.success)
    end

    inMinigame = false
    SetNuiFocus(false, false)

    cb(json.encode({}))
end)

---@param gridSize number
---@param timeLimit number
---@param enableSound boolean
---@return boolean
local function startPathMinigame(gridSize, timeLimit, enableSound)
    local result = false
    local completed = false
    
    if not startMinigame(function(success)
        result = success
        completed = true
    end, 'path', {
        gridSize = gridSize or 12,
        timeLimit = timeLimit or 30,
        enableSound = enableSound ~= false
    }) then
        return false
    end
    
    while not completed do
        Wait(100)
    end
    
    return result
end

---@param rounds number
---@param sequenceLength number
---@param showTime number
---@param inputTime number
---@return boolean
local function startSequenceMinigame(rounds, sequenceLength, showTime, inputTime)
    local result = false
    local completed = false
    
    if not startMinigame(function(success)
        result = success
        completed = true
    end, 'sequence', {
        rounds = rounds or 3,
        sequenceLength = sequenceLength or 3,
        showTime = showTime or 3000,
        inputTime = inputTime or 8000
    }) then
        return false
    end
    
    while not completed do
        Wait(100)
    end
    
    return result
end

exports('pathMinigame', startPathMinigame)
exports('sequenceMinigame', startSequenceMinigame)
