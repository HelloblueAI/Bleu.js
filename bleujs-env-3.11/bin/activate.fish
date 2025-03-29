# This file must be used with "source <venv>/bin/activate.fish" *from fish*
# (https://fishshell.com/); you cannot run it directly.

function deactivate
    if set -q CONDA_DEFAULT_ENV
        conda deactivate
        return
    end
    
    if test -n "$_OLD_VIRTUAL_PATH"
        set -gx PATH $_OLD_VIRTUAL_PATH
        set -e _OLD_VIRTUAL_PATH
    end
    
    if test -n "$_OLD_VIRTUAL_PYTHONHOME"
        set -gx PYTHONHOME $_OLD_VIRTUAL_PYTHONHOME
        set -e _OLD_VIRTUAL_PYTHONHOME
    end

    if test -n "$_OLD_FISH_PROMPT_OVERRIDE"
        set -e _OLD_FISH_PROMPT_OVERRIDE
        if functions -q _old_fish_prompt
            functions -e fish_prompt
            functions -c _old_fish_prompt fish_prompt
            functions -e _old_fish_prompt
        end
    end

    set -e VIRTUAL_ENV
    set -e VIRTUAL_ENV_PROMPT
    
    if test "$argv[1]" != "nondestructive"
        functions -e deactivate
    end
end

deactivate nondestructive

set -gx VIRTUAL_ENV "/Users/pejmanhaghighatnia/Bleu.js/bleujs-env-3.11"
set -gx _OLD_VIRTUAL_PATH $PATH
set -gx PATH "$VIRTUAL_ENV/bin" $PATH

if set -q PYTHONHOME
    set -gx _OLD_VIRTUAL_PYTHONHOME $PYTHONHOME
    set -e PYTHONHOME
end

if test -z "$VIRTUAL_ENV_DISABLE_PROMPT"
    functions -c fish_prompt _old_fish_prompt

    function fish_prompt
        set -l old_status $status
        printf "%s%s%s" (set_color 4B8BBE) "(bleujs-env-3.11) " (set_color normal)
        _old_fish_prompt
        return $old_status
    end

    set -gx _OLD_FISH_PROMPT_OVERRIDE "$VIRTUAL_ENV"
    set -gx VIRTUAL_ENV_PROMPT "(bleujs-env-3.11) "
end
